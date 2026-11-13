use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use base64::Engine;
use sha2::{Digest, Sha256};

pub const MAIN_PATCH_MARKER: &str = "/* __CURSOR_XUBEI_MAIN_INJECT__ */";
pub const MODEL_UNLOCK_MARKER: &str = "/*MOCURSO_MODELUNLOCK*/";
pub const AUTO_RESUME_MARKER: &str = "/*MOCURSO_AR*/";
pub const MAIN_BACKUP_SUFFIX: &str = ".backup.xubei";
pub const PRODUCT_BACKUP_SUFFIX: &str = ".backup.xubei";

static KEEPALIVE_RUNNING: AtomicBool = AtomicBool::new(false);

#[derive(serde::Serialize)]
pub struct PatchStatus {
    pub is_patched: bool,
    pub main_path: Option<String>,
    pub has_backup: bool,
}

/// 获取用户主目录下存放无感换号信号与 Token 的目录 (~/.cursor-tk)
pub fn get_cursor_tk_dir() -> Result<PathBuf, String> {
    let home = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map_err(|_| "无法获取用户主目录".to_string())?;
    let dir = PathBuf::from(home).join(".cursor-tk");
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    Ok(dir)
}

/// 定位 Cursor 主进程 JavaScript 文件 (resources/app/out/main.js)
pub fn find_main_js_path() -> Result<PathBuf, String> {
    // 策略 1: 基于已解析的 workbench 路径推导
    if let Ok(workbench_path) = super::workbench::find_workbench_path() {
        if let Some(vs_dir) = workbench_path.parent().and_then(|p| p.parent()) {
            if let Some(out_dir) = vs_dir.parent() {
                let candidate = out_dir.join("main.js");
                if candidate.exists() && candidate.is_file() {
                    return Ok(candidate);
                }
            }
        }
    }

    // 策略 2: 基于可执行文件探测 resources/app/out/main.js
    if let Ok(exe_str) = crate::process::find_cursor_executable() {
        let exe_path = Path::new(&exe_str);
        let mut current = Some(exe_path);
        let mut depth = 0;
        while let Some(dir) = current {
            if depth > 5 {
                break;
            }

            #[cfg(target_os = "macos")]
            let cands = [
                dir.join("Contents").join("Resources").join("app").join("out").join("main.js"),
                dir.join("Resources").join("app").join("out").join("main.js"),
            ];

            #[cfg(not(target_os = "macos"))]
            let cands = [
                dir.join("resources").join("app").join("out").join("main.js"),
                dir.join("app").join("out").join("main.js"),
            ];

            for c in &cands {
                if c.exists() && c.is_file() {
                    return Ok(c.clone());
                }
            }

            current = dir.parent();
            depth += 1;
        }
    }

    Err("未找到 Cursor 主进程文件 (out/main.js)，请先在设置中确认 Cursor 安装路径".into())
}

/// 定位 Cursor product.json 文件
pub fn find_product_json_path() -> Result<PathBuf, String> {
    let main_js = find_main_js_path()?;
    if let Some(out_dir) = main_js.parent() {
        if let Some(app_dir) = out_dir.parent() {
            let candidate = app_dir.join("product.json");
            if candidate.exists() {
                return Ok(candidate);
            }
        }
    }
    Err("未找到 product.json 文件".into())
}

/// 注入到 Cursor main.js 顶部的 Node.js 核心拦截脚本（与参考程序 cursor_auth_mu.js 机制一致）
fn get_main_injection_script() -> &'static str {
    include_str!("cursor_auth_mu.js")
}

/// 注入到 Cursor extensionHostProcess.js 的脚本（拦截 Extension Host 的 fetch/http 请求）
fn get_ext_host_injection_script() -> &'static str {
    include_str!("cursor_auth_mc.js")
}

pub const EXT_HOST_PATCH_MARKER: &str = "/* __CURSOR_XUBEI_MC_INJECT__ */";

/// 定位 extensionHostProcess.js
pub fn find_ext_host_path() -> Result<std::path::PathBuf, String> {
    let main_js = find_main_js_path()?;
    if let Some(out_dir) = main_js.parent() {
        let eh = out_dir
            .join("vs")
            .join("workbench")
            .join("api")
            .join("node")
            .join("extensionHostProcess.js");
        if eh.exists() {
            return Ok(eh);
        }
    }
    Err("未找到 extensionHostProcess.js".into())
}

/// 注入 cursor_auth_mc.js 到 extensionHostProcess.js
pub fn inject_ext_host_process() -> Result<(), String> {
    let eh_path = find_ext_host_path()?;
    let current_content = fs::read_to_string(&eh_path)
        .map_err(|e| format!("读取 extensionHostProcess.js 失败: {}", e))?;

    let backup = eh_path.with_extension("backup.xubei");

    // 如果已注入，检查是否是最新版（包含顶层 await 且含 __mcStreamWrapped）
    if current_content.contains(EXT_HOST_PATCH_MARKER) {
        if current_content.contains("__mcStreamWrapped") && !current_content.contains("(async()=>{try{") {
            return Ok(());
        }
        // 如果是旧版注入，优先从备份恢复纯净内容后再注入新版
        let clean_content = if backup.exists() {
            fs::read_to_string(&backup).unwrap_or_else(|_| current_content.clone())
        } else {
            current_content
        };
        let script = get_ext_host_injection_script();
        let new_content = format!("{}\n{}", script, clean_content);
        fs::write(&eh_path, new_content)
            .map_err(|e| format!("升级写入 extensionHostProcess.js 失败: {}", e))?;
        return Ok(());
    }

    // 首次注入：先备份
    if !backup.exists() {
        let _ = fs::copy(&eh_path, &backup);
    }

    let script = get_ext_host_injection_script();
    let new_content = format!("{}\n{}", script, current_content);
    fs::write(&eh_path, new_content)
        .map_err(|e| format!("写入 extensionHostProcess.js 失败: {}", e))?;

    Ok(())
}

/// 还原 extensionHostProcess.js
pub fn restore_ext_host_process() -> Result<(), String> {
    if let Ok(eh_path) = find_ext_host_path() {
        let backup = eh_path.with_extension("backup.xubei");
        if backup.exists() {
            if let Ok(content) = fs::read_to_string(&backup) {
                let _ = fs::write(&eh_path, content);
                let _ = fs::remove_file(&backup);
            }
        }
    }
    Ok(())
}

pub fn apply_model_unlock_and_checksum() -> Result<(), String> {
    // 获取 product.json 路径（后面两个 workbench 都要更新）
    let product_json_path = find_product_json_path().ok();

    // 备份 product.json（只备份一次）
    if let Some(ref prod_path) = product_json_path {
        let prod_backup = prod_path.with_extension(PRODUCT_BACKUP_SUFFIX);
        if !prod_backup.exists() {
            let _ = fs::copy(prod_path, &prod_backup);
        }
    }

    // 对两个 workbench 文件分别打补丁
    let workbench_candidates = {
        let mut paths = vec![];
        if let Ok(p) = super::workbench::find_workbench_path() {
            paths.push(("vs/workbench/workbench.desktop.main.js".to_string(), p.clone()));
            // glass 文件与 desktop 同目录
            let glass = p.with_file_name("workbench.glass.main.js");
            if glass.exists() {
                paths.push(("vs/workbench/workbench.glass.main.js".to_string(), glass));
            }
        }
        paths
    };

    for (checksum_key, workbench_path) in workbench_candidates {
        let content = match fs::read_to_string(&workbench_path) {
            Ok(c) => c,
            Err(_) => continue,
        };

        let mut modified = false;
        let mut new_content = content;

        // 策略A：在函数定义处强制 o='pro'
        if !new_content.contains(MODEL_UNLOCK_MARKER) {
            let re_membership = regex::Regex::new(r"storeMembershipType=([A-Za-z_$][\w$]*)=>\{")
                .map_err(|e| e.to_string())?;
            if re_membership.is_match(&new_content) {
                new_content = re_membership
                    .replace_all(&new_content, format!("storeMembershipType=$1=>{{{}$1='pro';", MODEL_UNLOCK_MARKER).as_str())
                    .to_string();
                modified = true;
            }
        }

        // 策略B：所有 storeMembershipType(ir.FREE) 调用改为 ir.PRO
        if !new_content.contains("/*MOCURSO_FORCE_PRO*/") {
            let re_call = regex::Regex::new(r"(storeMembershipType\()([A-Za-z_$][\w$]*)\.FREE(\))")
                .map_err(|e| e.to_string())?;
            if re_call.is_match(&new_content) {
                new_content = re_call
                    .replace_all(&new_content, "${1}/*MOCURSO_FORCE_PRO*/$2.PRO$3")
                    .to_string();
                modified = true;
            }
        }

        // 策略C：Free Plan 文案
        if !new_content.contains("/*MOCURSO_LABEL*/") {
            let label_old = "\"Free Plan\"";
            let label_new = "/*MOCURSO_LABEL*/\"Pro Plan\"";
            if new_content.contains(label_old) {
                new_content = new_content.replace(label_old, label_new);
                modified = true;
            }
        }

        // 策略D（关键）：自动恢复超时聊天补丁 /*MOCURSO_AR*/
        // 当注入脚本伪造 _mcTO() / _muTO() 超时帧时，Cursor 前端错误码位于 displayInfo.errorCode，
        // 必须打此补丁才能触发 "Auto-resuming chat after timeout" 无感续跑对话
        if !new_content.contains(AUTO_RESUME_MARKER) {
            let re_ar = regex::Regex::new(
                r#"([A-Za-z_$][\w$]*) instanceof ([A-Za-z_$][\w$]*)&&([A-Za-z_$][\w$]*)&&([A-Za-z_$][\w$]*)\.error===([A-Za-z_$][\w$]*)\.TIMEOUT\)(\{this\._structuredLogService\.info\("composer","Auto-resuming chat after timeout")"#,
            )
            .map_err(|e| e.to_string())?;
            if re_ar.is_match(&new_content) {
                new_content = re_ar
                    .replace_all(
                        &new_content,
                        "$1 instanceof $2&&$3&&($4.error===$5.TIMEOUT||/*MOCURSO_AR*/$4?.displayInfo?.errorCode===$5.TIMEOUT))$6",
                    )
                    .to_string();
                modified = true;
            }
        }

        if modified {
            let _ = fs::write(&workbench_path, &new_content);

            // 更新 product.json 中对应的 checksum
            if let Some(ref prod_path) = product_json_path {
                if let Ok(prod_str) = fs::read_to_string(prod_path) {
                    if let Ok(mut prod_val) = serde_json::from_str::<serde_json::Value>(&prod_str) {
                        if let Some(checksums) = prod_val.get_mut("checksums").and_then(|c| c.as_object_mut()) {
                            let mut hasher = Sha256::new();
                            hasher.update(new_content.as_bytes());
                            let hash = hasher.finalize();
                            let b64_hash = base64::engine::general_purpose::STANDARD.encode(hash);
                            checksums.insert(checksum_key.clone(), serde_json::Value::String(b64_hash));
                            if let Ok(updated_prod) = serde_json::to_string_pretty(&prod_val) {
                                let _ = fs::write(prod_path, updated_prod);
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

/// 将旧机器码到新机器码的等长映射累加写入 ~/.cursor-tk/machine_id_override
/// 供注入脚本 _mcSR / _mcBR / _muSR / _muBR 在网络层实时热替换
pub fn append_machine_id_mappings(pairs: &[(String, String)]) -> Result<usize, String> {
    let tk_dir = get_cursor_tk_dir()?;
    let override_file = tk_dir.join("machine_id_override");

    let mut existing_mappings: Vec<serde_json::Value> = Vec::new();
    if override_file.exists() {
        if let Ok(raw) = fs::read_to_string(&override_file) {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&raw) {
                if let Some(arr) = val.get("mappings").and_then(|m| m.as_array()) {
                    for item in arr {
                        let old_s = item.get("old").and_then(|v| v.as_str()).unwrap_or("");
                        let new_s = item.get("new").and_then(|v| v.as_str()).unwrap_or("");
                        if old_s.len() >= 8 && old_s.len() == new_s.len() && old_s != new_s {
                            existing_mappings.push(serde_json::json!({
                                "old": old_s,
                                "new": new_s,
                            }));
                        }
                    }
                }
            }
        }
    }

    for (old_id, new_id) in pairs {
        let old_trimmed = old_id.trim();
        let new_trimmed = new_id.trim();
        if old_trimmed.len() < 8 || old_trimmed.len() != new_trimmed.len() || old_trimmed == new_trimmed {
            continue;
        }
        // 如果之前有 A -> old_trimmed 的映射，级联更新为 A -> new_trimmed
        for item in existing_mappings.iter_mut() {
            if item.get("new").and_then(|v| v.as_str()) == Some(old_trimmed) {
                item["new"] = serde_json::Value::String(new_trimmed.to_string());
            }
        }
        // 移除已存在的相同 old_trimmed 映射
        existing_mappings.retain(|item| item.get("old").and_then(|v| v.as_str()) != Some(old_trimmed));
        existing_mappings.push(serde_json::json!({
            "old": old_trimmed,
            "new": new_trimmed,
        }));
    }

    // 最多保留最近 40 条映射
    if existing_mappings.len() > 40 {
        let drain_count = existing_mappings.len() - 40;
        existing_mappings.drain(0..drain_count);
    }

    let count = existing_mappings.len();
    let payload = serde_json::json!({ "mappings": existing_mappings });
    fs::write(&override_file, payload.to_string())
        .map_err(|e| format!("写入 machine_id_override 失败: {}", e))?;

    Ok(count)
}

/// 确保已激活环境中的补丁升级到最新版本（如补齐 /*MOCURSO_AR*/ 和新版 cursor_auth_mc.js）
pub fn ensure_latest_patches_applied() {
    if is_main_process_injected().unwrap_or(false) {
        let _ = inject_ext_host_process();
        let _ = apply_model_unlock_and_checksum();
    }
}

/// 执行主进程 Patch 注入、Auto模型解锁与无感拦截环境激活
pub fn inject_main_process(active_token: Option<&str>) -> Result<(), String> {
    let main_js_path = find_main_js_path()?;
    let content = fs::read_to_string(&main_js_path)
        .map_err(|e| format!("读取 main.js 失败: {}", e))?;

    // 1. 备份 main.js
    let backup_path = main_js_path.with_extension(MAIN_BACKUP_SUFFIX);
    if !backup_path.exists() && !content.contains(MAIN_PATCH_MARKER) {
        fs::write(&backup_path, &content)
            .map_err(|e| format!("备份 main.js 失败: {}", e))?;
    }

    // 2. 正则修补 getMachineId / getMacMachineId（移除 ?? 硬编码 fallback）
    let re_machine = regex::Regex::new(r"async getMachineId\(\)\{return [^?}]+\?\?([^}]+)\}")
        .map_err(|e| e.to_string())?;
    let content_step1 = if re_machine.is_match(&content) {
        re_machine.replace_all(&content, "async getMachineId(){return $1}").to_string()
    } else {
        content
    };

    let re_mac = regex::Regex::new(r"async getMacMachineId\(\)\{return [^?}]+\?\?([^}]+)\}")
        .map_err(|e| e.to_string())?;
    let content_step2 = if re_mac.is_match(&content_step1) {
        re_mac.replace_all(&content_step1, "async getMacMachineId(){return $1}").to_string()
    } else {
        content_step1
    };

    // 3. 注入 Hook 脚本到 main.js 头部
    let final_content = if !content_step2.contains(MAIN_PATCH_MARKER) {
        format!("{}\n{}", get_main_injection_script(), content_step2)
    } else {
        content_step2
    };

    fs::write(&main_js_path, final_content)
        .map_err(|e| format!("写入 main.js 注入补丁失败: {}", e))?;

    // 4. 注入 ExtensionHost 拦截脚本（cursor_auth_mc.js → extensionHostProcess.js）
    let _ = inject_ext_host_process();

    // 5. 解锁 Auto 模型、注入 /*MOCURSO_AR*/ 自动恢复补丁与更新 checksum
    let _ = apply_model_unlock_and_checksum();

    // 6. 初始化 machine_id_override（保留已有合法映射）
    let _ = append_machine_id_mappings(&[]);

    // 7. 创建并激活 ~/.cursor-tk/auto_switch_on 标记
    let tk_dir = get_cursor_tk_dir()?;
    let auto_switch_file = tk_dir.join("auto_switch_on");
    let now_str = chrono::Utc::now().timestamp_millis().to_string();
    fs::write(&auto_switch_file, now_str)
        .map_err(|e| format!("激活无感换号标记文件失败: {}", e))?;

    // 如果传入了明文 token，同步写入 active_token
    if let Some(tk) = active_token {
        let trimmed = tk.trim();
        if trimmed.len() > 20 && !trimmed.starts_with("cursor-safe-storage:") {
            let _ = sync_active_token(trimmed);
        }
    }

    // 8. 启动保活心跳
    start_keepalive_heartbeat();

    Ok(())
}

/// 还原主进程 Patch、Auto模型补丁与关闭无感拦截环境
pub fn restore_main_process() -> Result<(), String> {
    // 停止心跳
    KEEPALIVE_RUNNING.store(false, Ordering::Relaxed);

    // 1. 删除 auto_switch_on 标记与 machine_id_override
    if let Ok(tk_dir) = get_cursor_tk_dir() {
        let auto_switch_file = tk_dir.join("auto_switch_on");
        if auto_switch_file.exists() {
            let _ = fs::remove_file(auto_switch_file);
        }
        let override_file = tk_dir.join("machine_id_override");
        if override_file.exists() {
            let _ = fs::remove_file(override_file);
        }
    }

    // 2. 还原 extensionHostProcess.js (Extension Host 注入)
    let _ = restore_ext_host_process();

    // 3. 还原 main.js
    if let Ok(main_js_path) = find_main_js_path() {
        let backup_path = main_js_path.with_extension(MAIN_BACKUP_SUFFIX);
        if backup_path.exists() {
            let backup_content = fs::read_to_string(&backup_path)
                .map_err(|e| format!("读取备份文件失败: {}", e))?;
            fs::write(&main_js_path, backup_content)
                .map_err(|e| format!("还原 main.js 失败: {}", e))?;
            let _ = fs::remove_file(backup_path);
        }
    }

    // 4. 还原 product.json
    if let Ok(prod_path) = find_product_json_path() {
        let prod_backup = prod_path.with_extension(PRODUCT_BACKUP_SUFFIX);
        if prod_backup.exists() {
            if let Ok(backup_content) = fs::read_to_string(&prod_backup) {
                let _ = fs::write(&prod_path, backup_content);
                let _ = fs::remove_file(prod_backup);
            }
        }
    }

    // 5. 还原 workbench 文件（desktop 和 glass 都剥离补丁）
    if let Ok(workbench_path) = super::workbench::find_workbench_path() {
        let glass_path = workbench_path.with_file_name("workbench.glass.main.js");
        for path in [&workbench_path, &glass_path] {
            if let Ok(content) = fs::read_to_string(path) {
                if content.contains(MODEL_UNLOCK_MARKER)
                    || content.contains("/*MOCURSO_LABEL*/")
                    || content.contains("/*MOCURSO_FORCE_PRO*/")
                    || content.contains(AUTO_RESUME_MARKER)
                {
                    let cleaned = content
                        .replace("/*MOCURSO_MODELUNLOCK*/o='pro';", "")
                        .replace("/*MOCURSO_MODELUNLOCK*/$1='pro';", "")
                        .replace("/*MOCURSO_LABEL*/\"Pro Plan\"", "\"Free Plan\"");
                    let re_restore = regex::Regex::new(
                        r"(storeMembershipType\()/\*MOCURSO_FORCE_PRO\*/([A-Za-z_$][\w$]*)\.PRO(\))",
                    )
                    .ok();
                    let step2 = if let Some(re) = re_restore {
                        re.replace_all(&cleaned, "${1}${2}.FREE${3}").to_string()
                    } else {
                        cleaned
                    };
                    let re_ar_restore = regex::Regex::new(
                        r"\(([A-Za-z_$][\w$]*)\.error===([A-Za-z_$][\w$]*)\.TIMEOUT\|\|/\*MOCURSO_AR\*/[A-Za-z_$][\w$]*\?\.displayInfo\?\.errorCode===[A-Za-z_$][\w$]*\.TIMEOUT\)",
                    )
                    .ok();
                    let final_cleaned = if let Some(re) = re_ar_restore {
                        re.replace_all(&step2, "$1.error===$2.TIMEOUT").to_string()
                    } else {
                        step2
                    };
                    let _ = fs::write(path, final_cleaned);
                }
            }
        }
    }

    Ok(())
}

/// 检查主进程是否已成功注入
pub fn is_main_process_injected() -> Result<bool, String> {
    let main_js_path = find_main_js_path()?;
    if !main_js_path.exists() {
        return Ok(false);
    }
    let content = fs::read_to_string(&main_js_path)
        .map_err(|e| format!("读取 main.js 失败: {}", e))?;
    Ok(content.contains(MAIN_PATCH_MARKER))
}

/// 获取详细的补丁状态信息
pub fn get_patch_status() -> PatchStatus {
    // 如果已注入，自动静默补齐新版 /*MOCURSO_AR*/ 和新版 _mc 补丁
    ensure_latest_patches_applied();

    let path_res = find_main_js_path();
    let main_path = path_res.as_ref().ok().map(|p| p.to_string_lossy().to_string());
    let has_backup = path_res
        .as_ref()
        .ok()
        .map(|p| p.with_extension(MAIN_BACKUP_SUFFIX).exists())
        .unwrap_or(false);
    let is_patched = is_main_process_injected().unwrap_or(false);
    PatchStatus {
        is_patched,
        main_path,
        has_backup,
    }
}

/// 同步当前有效的 Access Token 到本地通信文件 (~/.cursor-tk/active_token)
pub fn sync_active_token(token: &str) -> Result<(), String> {
    let trimmed = token.trim();
    if trimmed.is_empty() || trimmed.starts_with("cursor-safe-storage:") {
        return Ok(());
    }
    let tk_dir = get_cursor_tk_dir()?;
    let token_file = tk_dir.join("active_token");
    fs::write(&token_file, trimmed)
        .map_err(|e| format!("写入 active_token 失败: {}", e))?;

    // 触碰 force_reconnect 文件通知拦截层刷新
    let reconnect_file = tk_dir.join("force_reconnect");
    let _ = fs::write(
        &reconnect_file,
        chrono::Utc::now().timestamp_millis().to_string(),
    );

    Ok(())
}

/// 后台保活心跳：持续刷新 auto_switch_on 的修改时间，保持无感换号处于活跃状态
pub fn start_keepalive_heartbeat() {
    if KEEPALIVE_RUNNING.swap(true, Ordering::SeqCst) {
        return;
    }

    std::thread::spawn(|| {
        while KEEPALIVE_RUNNING.load(Ordering::Relaxed) {
            if let Ok(tk_dir) = get_cursor_tk_dir() {
                let auto_switch_file = tk_dir.join("auto_switch_on");
                let now_str = chrono::Utc::now().timestamp_millis().to_string();
                let _ = fs::write(auto_switch_file, now_str);
            }
            std::thread::sleep(Duration::from_secs(5));
        }
    });
}
