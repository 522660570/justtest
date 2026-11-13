/// 自动换号监控器（与参考程序 AutoSwitch 三重检测机制对齐）
/// 1. 维持 ~/.cursor-tk/auto_switch_on 心跳（让 Cursor 注入脚本中的 _mcAS() / _muAS() 返回 true）
/// 2. 自动检查并补齐 ~/.cursor-tk/active_token（若缺失则从 Cursor 本地 SQLite 提取明文 JWT）
/// 3. 三重触发检测：
///    - 被动信号：监听 ~/.cursor-tk/quota_exhausted 信号文件（毫秒~秒级响应）
///    - 本地估算：监听 ~/.cursor-tk/tok_used 与 turn_active 实时追踪 Token 消耗
///    - 主动轮询：定时查询 Cursor 官方用量接口 (/api/usage-summary)，发现额度耗尽立即主动换号
/// 4. 换号执行闭环：
///    - 兼容加密/明文接口获取新账号
///    - 生成新机器码并写入 ~/.cursor-tk/machine_id_override 实现网络层无感热替换
///    - 更新 SQLite + storage.json + active_token + force_reconnect（触发前端 /*MOCURSO_AR*/ 自动续跑对话）

use std::fs;
use std::path::Path;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use base64::Engine as _;
use tauri::Emitter;

static CURRENT_SESSION: AtomicU64 = AtomicU64::new(0);

fn emit_log(app: &tauri::AppHandle, level: &str, msg: &str) {
    println!("[auto_switch] [{}] {}", level, msg);
    let _ = app.emit(
        "auto_switch_log",
        serde_json::json!({
            "level": level,
            "message": msg,
            "time": chrono::Local::now().format("%H:%M:%S").to_string()
        }),
    );
}

/// 判断字符串是否是有效的明文 JWT Token
fn is_valid_plain_jwt(s: &str) -> bool {
    let trimmed = s.trim();
    trimmed.len() > 20
        && !trimmed.starts_with("cursor-safe-storage:")
        && trimmed.contains('.')
}

/// 尝试从 SQLite 数据库读取明文 accessToken
fn try_read_token_from_sqlite(sqlite_path: &str) -> Option<String> {
    if sqlite_path.is_empty() || !Path::new(sqlite_path).exists() {
        return None;
    }
    let conn = rusqlite::Connection::open(sqlite_path).ok()?;
    let mut stmt = conn
        .prepare("SELECT value FROM ItemTable WHERE key IN ('cursorAuth/accessToken', 'cursor.accessToken')")
        .ok()?;
    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .ok()?;
    for r in rows.flatten() {
        if is_valid_plain_jwt(&r) {
            return Some(r.trim().to_string());
        }
    }
    None
}

/// 启动后台监控线程（心跳 + 自动补齐补丁与 Token + 三重额度耗尽监听）
pub fn start_monitor(
    app: tauri::AppHandle,
    license_code: String,
    old_email: String,
    api_base_url: String,
    sqlite_path: String,
    storage_path: String,
) {
    let session_id = CURRENT_SESSION.fetch_add(1, Ordering::SeqCst) + 1;

    std::thread::spawn(move || {
        // 确保底层补丁（包括 /*MOCURSO_AR*/ 和顶层 await 版 cursor_auth_mc.js）已更新到最新
        super::main_patch::ensure_latest_patches_applied();

        let mut last_handled_mtime: u128 = 0;
        let mut current_email = old_email;
        let mut last_heartbeat = Instant::now() - Duration::from_secs(10);
        let mut last_usage_check = Instant::now() - Duration::from_secs(15);
        let mut last_tok_used: u64 = 0;
        let mut last_switch_time = Instant::now() - Duration::from_secs(60);

        emit_log(
            &app,
            "info",
            &format!("自动换号监控器已就绪，三重监听已启动 (session: {})", session_id),
        );

        // ── 0. 自动检查并补齐 active_token ──
        if let Ok(tk_dir) = super::main_patch::get_cursor_tk_dir() {
            let token_file = tk_dir.join("active_token");
            let existing_token = if token_file.exists() {
                fs::read_to_string(&token_file)
                    .ok()
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
            } else {
                None
            };

            let valid_existing = existing_token
                .as_ref()
                .map(|t| is_valid_plain_jwt(t))
                .unwrap_or(false);

            if !valid_existing {
                // 尝试从 SQLite 提取明文 JWT（一键续杯写入的是明文 JWT）
                if let Some(sql_tk) = try_read_token_from_sqlite(&sqlite_path) {
                    let _ = super::main_patch::sync_active_token(&sql_tk);
                    emit_log(
                        &app,
                        "info",
                        "✅ 已从本地数据库自动同步明文 JWT 到 active_token，无感拦截与用量轮询已就绪",
                    );
                } else {
                    if existing_token.is_some() {
                        let _ = fs::write(&token_file, "");
                    }
                    emit_log(
                        &app,
                        "info",
                        "💡 自动换号就绪：正在监听额度耗尽信号（首次触发或点击一键续杯后将同步明文 Token）",
                    );
                }
            } else {
                emit_log(
                    &app,
                    "info",
                    "✅ active_token 已就绪（明文 JWT），注入脚本与主动轮询均处于待命状态",
                );
            }
        }

        while CURRENT_SESSION.load(Ordering::Relaxed) == session_id {
            std::thread::sleep(Duration::from_millis(800));

            if CURRENT_SESSION.load(Ordering::Relaxed) != session_id {
                break;
            }

            let tk_dir = match super::main_patch::get_cursor_tk_dir() {
                Ok(d) => d,
                Err(_) => continue,
            };

            // ── 1. 刷新 auto_switch_on 心跳（每 4 秒刷新一次） ──
            if last_heartbeat.elapsed() >= Duration::from_secs(4) {
                last_heartbeat = Instant::now();
                let auto_switch_file = tk_dir.join("auto_switch_on");
                let now_ms_str = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis()
                    .to_string();
                let _ = fs::write(&auto_switch_file, now_ms_str);
            }

            let mut trigger_reason: Option<String> = None;

            // ── 2. 检测通道 A：检查 quota_exhausted 信号文件（注入脚本捕获到 429 / resource_exhausted / UsageLimit） ──
            let quota_file = tk_dir.join("quota_exhausted");
            if quota_file.exists() {
                let raw_content = fs::read_to_string(&quota_file).unwrap_or_default();
                let file_ts: u128 = raw_content.trim().parse::<u128>().unwrap_or(0);

                let ts_ms = if file_ts > 0 {
                    file_ts
                } else {
                    fs::metadata(&quota_file)
                        .and_then(|m| m.modified())
                        .map(|t| t.duration_since(UNIX_EPOCH).unwrap_or_default().as_millis())
                        .unwrap_or(0)
                };

                let now_ms = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_millis();

                if ts_ms > last_handled_mtime && now_ms.saturating_sub(ts_ms) < 45_000 {
                    last_handled_mtime = ts_ms;
                    trigger_reason = Some("捕获到 Cursor 注入层 quota_exhausted 信号".to_string());
                } else if now_ms.saturating_sub(ts_ms) >= 45_000 {
                    // 清理过期的历史信号文件
                    let _ = fs::remove_file(&quota_file);
                }
            }

            // ── 3. 检测通道 B & C：本地 tok_used 消耗追踪 + 官方用量接口主动轮询 ──
            if trigger_reason.is_none() && last_switch_time.elapsed() >= Duration::from_secs(8) {
                let tok_used_file = tk_dir.join("tok_used");
                let current_tok_used: u64 = if tok_used_file.exists() {
                    fs::read_to_string(&tok_used_file)
                        .ok()
                        .and_then(|s| s.trim().parse::<f64>().ok())
                        .map(|v| v as u64)
                        .unwrap_or(0)
                } else {
                    0
                };

                let turn_active_file = tk_dir.join("turn_active");
                let is_turn_active = if turn_active_file.exists() {
                    fs::metadata(&turn_active_file)
                        .and_then(|m| m.modified())
                        .map(|t| t.elapsed().unwrap_or(Duration::from_secs(999)) < Duration::from_secs(5))
                        .unwrap_or(false)
                } else {
                    false
                };

                // 当有新的 Token 消耗时，缩短官方接口检查间隔为 6 秒；平时每 20 秒检查一次
                let tok_increased = current_tok_used > last_tok_used;
                if tok_increased {
                    last_tok_used = current_tok_used;
                }
                let check_interval = if tok_increased || is_turn_active {
                    Duration::from_secs(6)
                } else {
                    Duration::from_secs(20)
                };

                if last_usage_check.elapsed() >= check_interval {
                    last_usage_check = Instant::now();
                    let active_token_file = tk_dir.join("active_token");
                    let active_tk = fs::read_to_string(&active_token_file)
                        .ok()
                        .map(|s| s.trim().to_string())
                        .filter(|s| is_valid_plain_jwt(s))
                        .or_else(|| try_read_token_from_sqlite(&sqlite_path));

                    if let Some(tk) = active_tk {
                        if let Some(reason) = check_official_usage_exhausted(&tk) {
                            trigger_reason = Some(format!("官方用量检测触发 ({})", reason));
                        }
                    }
                }
            }

            // ── 4. 执行无感换号闭环 ──
            if let Some(reason) = trigger_reason {
                emit_log(
                    &app,
                    "warn",
                    &format!(
                        "⚡ {}！正在请求新账号 (当前邮箱: {})...",
                        reason, current_email
                    ),
                );

                match fetch_new_account(&api_base_url, &license_code, &current_email) {
                    Ok((new_email, access_token, refresh_token)) => {
                        last_switch_time = Instant::now();
                        last_tok_used = 0;

                        // 4.1 生成新机器码并更新 ~/.cursor-tk/machine_id_override + storage.json + SQLite
                        let mapping_count = rotate_machine_ids_and_override(&sqlite_path, &storage_path);
                        if mapping_count > 0 {
                            emit_log(
                                &app,
                                "info",
                                &format!("🔄 已生成新机器码并更新网络层热替换映射 (共 {} 条)", mapping_count),
                            );
                        }

                        // 4.2 静默更新本地 SQLite 账号信息
                        if !sqlite_path.is_empty() {
                            write_auth_to_sqlite(
                                &sqlite_path,
                                &new_email,
                                &access_token,
                                &refresh_token,
                            );
                        }

                        // 4.3 静默更新 storage.json 账号信息
                        if !storage_path.is_empty() {
                            write_auth_to_storage(
                                &storage_path,
                                &new_email,
                                &access_token,
                                &refresh_token,
                            );
                        }

                        // 4.4 写入 active_token 并触碰 force_reconnect 通知 Cursor 注入层立即注入 _mcTO 超时帧续跑
                        if let Err(e) = super::main_patch::sync_active_token(&access_token) {
                            emit_log(&app, "error", &format!("写入 active_token 失败: {}", e));
                        }

                        // 4.5 清理已处理的信号文件与重置 tok_used 计数
                        let _ = fs::remove_file(&quota_file);
                        let _ = fs::write(tk_dir.join("tok_used"), "0");

                        // 4.6 同步到 HTTP 轮询备份通道
                        super::http_server::push_switch(
                            access_token.clone(),
                            refresh_token.clone(),
                            new_email.clone(),
                        );

                        emit_log(
                            &app,
                            "success",
                            &format!(
                                "🎉 自动换号成功！新账号: {}，Token 与机器码已热切换，Cursor 正在自动续跑对话",
                                new_email
                            ),
                        );

                        // 4.7 推送账号更新事件通知前端刷新界面
                        let _ = app.emit(
                            "auto_switch_account_updated",
                            serde_json::json!({
                                "email": new_email,
                                "accessToken": access_token
                            }),
                        );

                        current_email = new_email;
                    }
                    Err(e) => {
                        emit_log(&app, "error", &format!("❌ 自动换号失败: {}", e));
                        // 避免请求失败时紧挨着狂刷接口，稍微冷却 5 秒
                        std::thread::sleep(Duration::from_secs(5));
                    }
                }
            }
        }

        // 退出循环时，删除 auto_switch_on 文件
        if let Ok(tk_dir) = super::main_patch::get_cursor_tk_dir() {
            let auto_switch_file = tk_dir.join("auto_switch_on");
            if auto_switch_file.exists() {
                let _ = fs::remove_file(auto_switch_file);
            }
        }

        emit_log(
            &app,
            "info",
            &format!("自动换号监控器已停止 (session: {})", session_id),
        );
    });
}

/// 停止监控器并删除心跳标记
pub fn stop_monitor() {
    CURRENT_SESSION.fetch_add(1, Ordering::SeqCst);
    if let Ok(tk_dir) = super::main_patch::get_cursor_tk_dir() {
        let auto_switch_file = tk_dir.join("auto_switch_on");
        if auto_switch_file.exists() {
            let _ = fs::remove_file(auto_switch_file);
        }
    }
}

/// 从明文 JWT 中提取 user_id 并构造 WorkosCursorSessionToken Cookie 值
fn build_session_cookie_from_jwt(jwt: &str) -> String {
    let parts: Vec<&str> = jwt.split('.').collect();
    if parts.len() >= 2 {
        let payload_b64 = parts[1];
        let decoded = base64::engine::general_purpose::URL_SAFE_NO_PAD
            .decode(payload_b64)
            .or_else(|_| base64::engine::general_purpose::STANDARD_NO_PAD.decode(payload_b64))
            .or_else(|_| base64::engine::general_purpose::STANDARD.decode(payload_b64));
        if let Ok(bytes) = decoded {
            if let Ok(val) = serde_json::from_slice::<serde_json::Value>(&bytes) {
                if let Some(sub) = val.get("sub").and_then(|s| s.as_str()) {
                    // sub 格式通常为 "auth0|user_01J..."
                    let user_id = sub.split('|').last().unwrap_or(sub);
                    if !user_id.is_empty() {
                        return format!("{}%3A%3A{}", user_id, jwt);
                    }
                }
            }
        }
    }
    jwt.to_string()
}

/// 主动查询 Cursor 官方用量接口，判断额度是否已耗尽
fn check_official_usage_exhausted(jwt: &str) -> Option<String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(8))
        .build()
        .ok()?;

    let cookie_val = build_session_cookie_from_jwt(jwt);

    let resp = client
        .get("https://cursor.com/api/usage-summary")
        .header("Cookie", format!("WorkosCursorSessionToken={}", cookie_val))
        .header("Authorization", format!("Bearer {}", jwt))
        .header(
            "User-Agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        )
        .send()
        .ok()?;

    if !resp.status().is_success() {
        return None;
    }

    let json: serde_json::Value = resp.json().ok()?;

    // 1. 检查 individualUsage.plan
    let plan = &json["individualUsage"]["plan"];
    if plan.is_object() {
        let api_pct = plan["apiPercentUsed"].as_f64().unwrap_or(0.0);
        let auto_pct = plan["autoPercentUsed"].as_f64().unwrap_or(0.0);
        let total_pct = plan["totalPercentUsed"].as_f64().unwrap_or(0.0);

        if api_pct >= 100.0 {
            return Some(format!("apiPercentUsed={:.1}%", api_pct));
        }
        if auto_pct >= 100.0 {
            return Some(format!("autoPercentUsed={:.1}%", auto_pct));
        }
        if total_pct >= 100.0 {
            return Some(format!("totalPercentUsed={:.1}%", total_pct));
        }
    }

    // 2. 检查 planUsage (dashboard 格式兼容)
    let plan_usage = &json["planUsage"];
    if plan_usage.is_object() {
        let api_pct = plan_usage["apiPercentUsed"].as_f64().unwrap_or(0.0);
        let auto_pct = plan_usage["autoPercentUsed"].as_f64().unwrap_or(0.0);
        let total_pct = plan_usage["totalPercentUsed"].as_f64().unwrap_or(0.0);
        let remaining = plan_usage["remainingPercent"].as_f64().unwrap_or(100.0);

        if api_pct >= 100.0 || auto_pct >= 100.0 || total_pct >= 100.0 || remaining <= 0.0 {
            return Some(format!(
                "planUsage api={:.1}% auto={:.1}% total={:.1}%",
                api_pct, auto_pct, total_pct
            ));
        }
    }

    // 3. 检查 legacy gpt4 字段
    if let (Some(total), Some(max)) = (
        json["gpt4"]["numRequestsTotal"].as_u64(),
        json["gpt4"]["maxRequestUsage"].as_u64(),
    ) {
        if max > 0 && total >= max {
            return Some(format!("gpt4 requests={}/{}", total, max));
        }
    }

    if json["hitLimit"].as_bool() == Some(true) || json["isBlocked"].as_bool() == Some(true) {
        return Some("hitLimit=true".to_string());
    }

    None
}

/// 从可能是 sessionToken（如 user_01xxx::eyJ...）的字符串中提取纯 JWT
fn extract_clean_jwt(raw: &str) -> String {
    let trimmed = raw.trim();
    if let Some(idx) = trimmed.find("::") {
        return trimmed[idx + 2..].trim().to_string();
    }
    if let Some(idx) = trimmed.find("%3A%3A") {
        return trimmed[idx + 6..].trim().to_string();
    }
    if let Some(idx) = trimmed.find("%3a%3a") {
        return trimmed[idx + 6..].trim().to_string();
    }
    trimmed.to_string()
}

/// 通过 API 获取新账号，兼容 AES-GCM 加密 data 与明文 data，返回 (email, accessToken, refreshToken)
fn fetch_new_account(
    api_base_url: &str,
    license_code: &str,
    old_email: &str,
) -> Result<(String, String, String), String> {
    let email_to_use = if old_email.trim().is_empty() {
        "no-current-account"
    } else {
        old_email.trim()
    };

    // 不要手动 percent-encode！reqwest 会自动对 URL 进行编码，
    // 手动替换 @ 为 %40 会被 reqwest 二次编码为 %2540，导致服务器返回 400/500
    let mac = get_mac_address();

    let base = api_base_url.trim_end_matches('/');
    let url = format!(
        "{}/getAccountByCode/{}/{}/{}",
        base, license_code, mac, email_to_use
    );
    println!("[自动换号] 🔗 请求 URL: {}", url);

    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| format!("构建 HTTP 客户端失败: {}", e))?;

    let resp = client
        .get(&url)
        .header("Content-Type", "application/json")
        .header("X-App-Version", "2.0.3")
        .header(
            "User-Agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        )
        .send()
        .map_err(|e| format!("HTTP 请求失败: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().unwrap_or_else(|_| "无法读取响应体".to_string());
        println!("[自动换号] ❌ HTTP {} - URL: {} - Body: {}", status, url, body);
        return Err(format!("HTTP 状态码异常: {} - {}", status, body));
    }

    let json: serde_json::Value = resp
        .json()
        .map_err(|e| format!("解析响应 JSON 失败: {}", e))?;

    let is_ok = json["code"].as_i64() == Some(1)
        || json["code"].as_i64() == Some(200)
        || json["success"].as_bool() == Some(true)
        || json["data"].is_string()
        || json["data"].is_object();

    if !is_ok {
        let err_msg = json["message"]
            .as_str()
            .or_else(|| json["msg"].as_str())
            .or_else(|| json["error"].as_str())
            .unwrap_or("未知错误");
        return Err(format!("接口返回失败: {}", err_msg));
    }

    // 兼容 data 为加密字符串或明文 JSON 对象两种情况
    let data_obj: serde_json::Value = if let Some(enc_str) = json["data"].as_str() {
        let decrypted = super::crypto::decrypt(enc_str)
            .map_err(|e| format!("解密账号数据失败: {}", e))?;
        serde_json::from_str(&decrypted)
            .map_err(|e| format!("解析解密后的账号 JSON 失败: {}", e))?
    } else if json["data"].is_object() {
        json["data"].clone()
    } else {
        let err_msg = json["message"]
            .as_str()
            .or_else(|| json["error"].as_str())
            .unwrap_or("响应缺少 data 字段");
        return Err(format!("接口返回异常: {}", err_msg));
    };

    let email = data_obj["email"].as_str().unwrap_or("").to_string();

    let raw_access = data_obj["accessToken"]
        .as_str()
        .filter(|s| !s.trim().is_empty())
        .or_else(|| data_obj["token"].as_str().filter(|s| !s.trim().is_empty()))
        .or_else(|| data_obj["sessionToken"].as_str().filter(|s| !s.trim().is_empty()))
        .or_else(|| {
            data_obj["WorkosCursorSessionToken"]
                .as_str()
                .filter(|s| !s.trim().is_empty())
        })
        .unwrap_or("");

    let access_token = extract_clean_jwt(raw_access);

    let raw_refresh = data_obj["refreshToken"]
        .as_str()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or(&access_token);
    let refresh_token = extract_clean_jwt(raw_refresh);

    if access_token.is_empty() {
        return Err("接口返回的 accessToken 为空".to_string());
    }

    Ok((email, access_token, refresh_token))
}

/// 生成新机器码，同时将旧机器码 -> 新机器码映射写入 ~/.cursor-tk/machine_id_override，并更新 SQLite 与 storage.json
fn rotate_machine_ids_and_override(sqlite_path: &str, storage_path: &str) -> usize {
    let new_ids = crate::machine_id::generate_all();
    let new_map = crate::machine_id::as_json_map(&new_ids);
    let mut pairs: Vec<(String, String)> = Vec::new();

    // 1. 从 storage.json 读取旧机器码并写入新机器码
    if !storage_path.is_empty() && Path::new(storage_path).exists() {
        if let Ok(raw) = fs::read_to_string(storage_path) {
            if let Ok(mut config) = serde_json::from_str::<serde_json::Value>(&raw) {
                if let Some(obj) = config.as_object_mut() {
                    for (k, new_v) in &new_map {
                        if let Some(new_str) = new_v.as_str() {
                            if let Some(old_str) = obj.get(k).and_then(|v| v.as_str()) {
                                if old_str.len() == new_str.len() && old_str != new_str {
                                    pairs.push((old_str.to_string(), new_str.to_string()));
                                }
                            }
                            obj.insert(k.clone(), serde_json::Value::String(new_str.to_string()));
                        }
                    }
                    if let Ok(updated) = serde_json::to_string_pretty(&config) {
                        let _ = fs::write(storage_path, updated);
                    }
                }
            }
        }
    }

    // 2. 从 SQLite 读取旧机器码并更新新机器码 + 清理 cursorai/serverConfig
    if !sqlite_path.is_empty() && Path::new(sqlite_path).exists() {
        if let Ok(conn) = rusqlite::Connection::open(sqlite_path) {
            for (k, new_v) in &new_map {
                if let Some(new_str) = new_v.as_str() {
                    if let Ok(old_str) = conn.query_row(
                        "SELECT value FROM ItemTable WHERE key = ?1",
                        rusqlite::params![k],
                        |row| row.get::<_, String>(0),
                    ) {
                        if old_str.len() == new_str.len() && old_str != new_str {
                            pairs.push((old_str, new_str.to_string()));
                        }
                    }
                    let _ = conn.execute(
                        "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?1, ?2)",
                        rusqlite::params![k, new_str],
                    );
                }
            }
            let _ = conn.execute(
                "DELETE FROM ItemTable WHERE key = 'cursorai/serverConfig'",
                [],
            );
        }
    }

    // 3. 将旧机器码 -> 新机器码映射写入 ~/.cursor-tk/machine_id_override
    super::main_patch::append_machine_id_mappings(&pairs).unwrap_or(0)
}

/// 获取本机 MAC 地址（直接复用 commands 模块中已验证且带回退机制的标准实现）
fn get_mac_address() -> String {
    crate::commands::get_mac_address().unwrap_or_else(|_| "00-00-00-00-00-00".to_string())
}

/// 将新账号写入 Cursor SQLite 数据库
fn write_auth_to_sqlite(sqlite_path: &str, email: &str, access_token: &str, refresh_token: &str) {
    use rusqlite::Connection;

    let conn = match Connection::open(sqlite_path) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("[auto_switch] 打开 SQLite 失败: {}", e);
            return;
        }
    };

    let entries = [
        ("cursorAuth/cachedEmail", email),
        ("cursorAuth/accessToken", access_token),
        ("cursorAuth/refreshToken", refresh_token),
        ("cursorAuth/cachedSignUpType", "Auth_0"),
        ("cursorAuth/isAuthenticated", "true"),
        ("cursor.email", email),
        ("cursor.accessToken", access_token),
    ];

    for (key, value) in &entries {
        let _ = conn.execute(
            "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?1, ?2)",
            rusqlite::params![key, value],
        );
    }
}

/// 将新账号写入 storage.json
fn write_auth_to_storage(
    storage_path: &str,
    email: &str,
    access_token: &str,
    refresh_token: &str,
) {
    let raw = match fs::read_to_string(storage_path) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[auto_switch] 读取 storage.json 失败: {}", e);
            return;
        }
    };

    let mut config: serde_json::Value = match serde_json::from_str(&raw) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("[auto_switch] 解析 storage.json 失败: {}", e);
            return;
        }
    };

    let obj = match config.as_object_mut() {
        Some(o) => o,
        None => return,
    };

    obj.insert(
        "cursorAuth/cachedEmail".to_string(),
        serde_json::json!(email),
    );
    obj.insert(
        "cursorAuth/accessToken".to_string(),
        serde_json::json!(access_token),
    );
    obj.insert(
        "cursorAuth/refreshToken".to_string(),
        serde_json::json!(refresh_token),
    );
    obj.insert(
        "cursorAuth/cachedSignUpType".to_string(),
        serde_json::json!("Auth_0"),
    );
    obj.insert("cursor.email".to_string(), serde_json::json!(email));
    obj.insert(
        "cursor.accessToken".to_string(),
        serde_json::json!(access_token),
    );

    let new_content = match serde_json::to_string_pretty(&config) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[auto_switch] 序列化 storage.json 失败: {}", e);
            return;
        }
    };

    if let Err(e) = fs::write(storage_path, new_content) {
        eprintln!("[auto_switch] 写入 storage.json 失败: {}", e);
    }
}
