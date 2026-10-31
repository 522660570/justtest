/// 自动换号监控器
/// 监听 ~/.cursor-tk/quota_exhausted 文件的修改时间，
/// 检测到额度耗尽信号后，立即通过 API 获取新账号并写入 active_token，
/// 注入脚本（cursor_inject.js）的 _muWT() 函数在 30 秒内会读取到新 token 完成无感重试。

use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

static CURRENT_SESSION: AtomicU64 = AtomicU64::new(0);

/// 启动后台监控线程
pub fn start_monitor(
    license_code: String,
    old_email: String,
    api_base_url: String,
    sqlite_path: String,
    storage_path: String,
) {
    // 递增 session id，使旧线程立即自然终止，启动新线程
    let session_id = CURRENT_SESSION.fetch_add(1, Ordering::SeqCst) + 1;

    std::thread::spawn(move || {
        let mut last_handled_mtime: u128 = 0;
        let mut current_email = old_email;

        println!("[auto_switch] 监控器已启动 (session: {})", session_id);

        while CURRENT_SESSION.load(Ordering::Relaxed) == session_id {
            std::thread::sleep(Duration::from_secs(2));

            if CURRENT_SESSION.load(Ordering::Relaxed) != session_id {
                break;
            }

            // 获取 ~/.cursor-tk 目录
            let tk_dir = match super::main_patch::get_cursor_tk_dir() {
                Ok(d) => d,
                Err(_) => continue,
            };

            let quota_file = tk_dir.join("quota_exhausted");
            if !quota_file.exists() {
                continue;
            }

            // 读取 quota_exhausted 的修改时间（ms）
            let mtime_ms = match fs::metadata(&quota_file)
                .and_then(|m| m.modified())
                .map(|t| t.duration_since(UNIX_EPOCH).unwrap_or_default().as_millis())
            {
                Ok(t) => t,
                Err(_) => continue,
            };

            // 获取当前时间（ms）
            let now_ms = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis();

            // 条件：quota_exhausted 在最近 20 秒内被更新，且是尚未处理过的新信号
            if mtime_ms > last_handled_mtime && (now_ms.saturating_sub(mtime_ms)) < 20_000 {
                last_handled_mtime = mtime_ms;
                println!("[auto_switch] 检测到额度耗尽信号 (mtime: {})，准备换号...", mtime_ms);

                // 调用 API 获取新账号
                match fetch_new_account(&api_base_url, &license_code, &current_email) {
                    Ok((new_email, access_token, refresh_token)) => {
                        println!("[auto_switch] 获取新账号成功: {}", new_email);

                        // 写入 active_token + force_reconnect（通知注入脚本）
                        if let Err(e) = super::main_patch::sync_active_token(&access_token) {
                            eprintln!("[auto_switch] 写入 active_token 失败: {}", e);
                        }

                        // 写入 SQLite（后台写，忽略失败）
                        if !sqlite_path.is_empty() {
                            write_auth_to_sqlite(&sqlite_path, &new_email, &access_token, &refresh_token);
                        }

                        // 写入 storage.json（后台写，忽略失败）
                        if !storage_path.is_empty() {
                            write_auth_to_storage(&storage_path, &new_email, &access_token, &refresh_token);
                        }

                        // 更新当前邮箱，后续额度耗尽换号使用新邮箱
                        current_email = new_email;

                        println!("[auto_switch] 换号完成，注入脚本将在 500ms 内读取到新 token");
                    }
                    Err(e) => {
                        eprintln!("[auto_switch] 获取新账号失败: {}", e);
                    }
                }
            }
        }

        println!("[auto_switch] 监控器已停止 (session: {})", session_id);
    });
}

/// 停止监控器
pub fn stop_monitor() {
    // 递增 session，使当前运行的监控循环退出
    CURRENT_SESSION.fetch_add(1, Ordering::SeqCst);
}

/// 检查监控器是否运行中
pub fn is_running() -> bool {
    CURRENT_SESSION.load(Ordering::Relaxed) % 2 != 0
}

/// 通过 API 获取新账号，返回 (email, accessToken, refreshToken)
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

    // 简单编码 email（替换 @ 和空格）
    let encoded_email = email_to_use.replace('@', "%40").replace(' ', "%20");

    // 获取 MAC 地址
    let mac = get_mac_address();

    let base = api_base_url.trim_end_matches('/');
    let url = format!("{}/getAccountByCode/{}/{}/{}", base, license_code, mac, encoded_email);

    println!("[auto_switch] 请求: {}", url);

    let resp = reqwest::blocking::get(&url)
        .map_err(|e| format!("HTTP 请求失败: {}", e))?;

    let json: serde_json::Value = resp
        .json()
        .map_err(|e| format!("解析响应 JSON 失败: {}", e))?;

    let success = json["success"].as_bool().unwrap_or(false);
    if !success {
        return Err(format!("API 返回失败: {}", json));
    }

    let data = &json["data"];
    let email = data["email"].as_str().unwrap_or("").to_string();
    let access_token = data["accessToken"].as_str().unwrap_or("").to_string();
    let refresh_token = data["refreshToken"]
        .as_str()
        .unwrap_or(data["accessToken"].as_str().unwrap_or(""))
        .to_string();

    if access_token.is_empty() {
        return Err("accessToken 为空".to_string());
    }

    Ok((email, access_token, refresh_token))
}

/// 获取本机 MAC 地址（格式：XX-XX-XX-XX-XX-XX）
fn get_mac_address() -> String {
    use std::process::Command;

    // Windows: getmac /fo csv /nh
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        if let Ok(output) = Command::new("getmac")
            .args(["/fo", "csv", "/nh"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
        {
            let s = String::from_utf8_lossy(&output.stdout);
            // CSV 第一行第一列类似 "A4-B1-C2-D3-E4-F5"
            if let Some(line) = s.lines().next() {
                let trimmed = line.trim_matches('"').split(',').next().unwrap_or("").trim().to_string();
                if !trimmed.is_empty() && trimmed != "N/A" {
                    return trimmed;
                }
            }
        }
    }

    // macOS / Linux: ifconfig / ip
    #[cfg(not(target_os = "windows"))]
    {
        if let Ok(output) = Command::new("sh")
            .args(["-c", "ifconfig | grep -o '[0-9a-f:]\\{17\\}' | head -1"])
            .output()
        {
            let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !s.is_empty() {
                return s;
            }
        }
    }

    "00-00-00-00-00-00".to_string()
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

/// 将新账号写入 storage.json（Cursor 存储文件）
fn write_auth_to_storage(storage_path: &str, email: &str, access_token: &str, refresh_token: &str) {
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

    obj.insert("cursorAuth/cachedEmail".to_string(), serde_json::json!(email));
    obj.insert("cursorAuth/accessToken".to_string(), serde_json::json!(access_token));
    obj.insert("cursorAuth/refreshToken".to_string(), serde_json::json!(refresh_token));
    obj.insert("cursorAuth/cachedSignUpType".to_string(), serde_json::json!("Auth_0"));
    obj.insert("cursor.email".to_string(), serde_json::json!(email));
    obj.insert("cursor.accessToken".to_string(), serde_json::json!(access_token));

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
