use std::process::Command as ProcessCommand;
use serde::Serialize;
use uuid::Uuid;
use sha2::Digest;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use crate::{cursor_db, machine_id, process, seamless};

const CREATE_NO_WINDOW: u32 = 0x08000000;

// ── File System ──

#[tauri::command]
pub fn fs_access(path: String) -> Result<bool, String> {
    Ok(std::path::Path::new(&path).exists())
}

#[tauri::command]
pub fn fs_read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| format!("Read failed: {}", e))
}

#[tauri::command]
pub fn fs_write_file(path: String, data: String) -> Result<(), String> {
    let p = std::path::Path::new(&path);
    if cfg!(target_os = "windows") {
        remove_readonly(p).ok();
    }
    if let Some(parent) = p.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("Create dir failed: {}", e))?;
    }
    std::fs::write(p, &data).map_err(|e| format!("Write failed: {}", e))
}

fn remove_readonly(path: &std::path::Path) -> Result<(), String> {
    let mut perms = std::fs::metadata(path)
        .map_err(|e| format!("Metadata failed: {}", e))?
        .permissions();
    perms.set_readonly(false);
    std::fs::set_permissions(path, perms).map_err(|e| format!("Set permissions failed: {}", e))
}

#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<serde_json::Value>, String> {
    let dir = std::fs::read_dir(&path).map_err(|e| format!("Read dir failed: {}", e))?;
    let mut entries = Vec::new();
    for entry in dir {
        let entry = entry.map_err(|e| format!("Entry failed: {}", e))?;
        let ft = entry.file_type().map_err(|e| format!("File type failed: {}", e))?;
        entries.push(serde_json::json!({
            "name": entry.file_name().to_string_lossy(),
            "isDirectory": ft.is_dir(),
            "isFile": ft.is_file(),
            "path": entry.path().to_string_lossy(),
        }));
    }
    Ok(entries)
}

#[tauri::command]
pub fn unlock_file(path: String) -> Result<serde_json::Value, String> {
    let p = std::path::Path::new(&path);
    for i in 0..5 {
        if i > 0 {
            std::thread::sleep(std::time::Duration::from_millis(200));
        }
        match std::fs::rename(p, p.with_extension(".tmp")) {
            Ok(_) => {
                std::fs::rename(p.with_extension(".tmp"), p).ok();
                return Ok(serde_json::json!({ "success": true, "method": "rename" }));
            }
            Err(_) => continue,
        }
    }
    for i in 0..3 {
        if i > 0 {
            std::thread::sleep(std::time::Duration::from_millis(300));
        }
        if let Ok(_) = std::fs::copy(p, p.with_extension(".bak")) {
            if std::fs::remove_file(p).is_ok() {
                std::fs::rename(p.with_extension(".bak"), p).ok();
                return Ok(serde_json::json!({ "success": true, "method": "copy-delete" }));
            }
        }
    }
    Err("Failed to unlock file after retries".into())
}

// ── Path / System Info ──

#[tauri::command]
pub fn get_platform() -> String {
    if cfg!(target_os = "windows") { "win32".into() }
    else if cfg!(target_os = "macos") { "darwin".into() }
    else { "linux".into() }
}

#[tauri::command]
pub fn get_homedir() -> Result<String, String> {
    std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Cannot determine home directory".into())
}

#[tauri::command]
pub fn path_join(args: Vec<String>) -> String {
    let path: std::path::PathBuf = args.iter().collect();
    path.to_string_lossy().to_string()
}

#[tauri::command]
pub fn get_app_version() -> String {
    "1.9.1".into()
}

#[tauri::command]
pub fn get_app_environment() -> serde_json::Value {
    serde_json::json!({
        "environment": if cfg!(debug_assertions) { "development" } else { "production" },
        "isDev": cfg!(debug_assertions)
    })
}

#[tauri::command]
pub fn get_debug_mode() -> bool {
    false
}

// ── Config File ──

fn config_dir() -> Result<std::path::PathBuf, String> {
    let home = get_homedir()?;
    Ok(std::path::Path::new(&home).join(".cursor-renewal-tool"))
}

fn config_path() -> Result<std::path::PathBuf, String> {
    Ok(config_dir()?.join("config.json"))
}

#[tauri::command]
pub fn read_config_file() -> Result<String, String> {
    let path = config_path()?;
    if path.exists() {
        std::fs::read_to_string(&path).map_err(|e| format!("Read config failed: {}", e))
    } else {
        Ok("{}".into())
    }
}

#[tauri::command]
pub fn write_config_file(data: String) -> Result<(), String> {
    let path = config_path()?;
    let dir = config_dir()?;
    std::fs::create_dir_all(&dir).map_err(|e| format!("Create config dir failed: {}", e))?;
    std::fs::write(&path, &data).map_err(|e| format!("Write config failed: {}", e))
}

#[tauri::command]
pub fn delete_config_file() -> Result<(), String> {
    let path = config_path()?;
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| format!("Delete config failed: {}", e))
    } else {
        Ok(())
    }
}

#[tauri::command]
pub fn get_config_file_info() -> Result<serde_json::Value, String> {
    let path = config_path()?;
    if !path.exists() {
        return Ok(serde_json::json!({ "exists": false }));
    }
    let meta = std::fs::metadata(&path).map_err(|e| format!("Metadata failed: {}", e))?;
    let content = std::fs::read_to_string(&path).unwrap_or_default();
    let has_license = content.contains("licenseCode") || content.contains("license_code");
    Ok(serde_json::json!({
        "exists": true,
        "path": path.to_string_lossy(),
        "size": meta.len(),
        "modified": chrono::DateTime::<chrono::Utc>::from(meta.modified().unwrap()).to_rfc3339(),
        "hasLicenseCode": has_license,
    }))
}

// ── SQLite ──

#[tauri::command]
pub fn sqlite_query(db_path: String, query: String, params: Vec<serde_json::Value>) -> Result<serde_json::Value, String> {
    cursor_db::query(&db_path, &query, &params)
}

#[tauri::command]
pub fn sqlite_batch_run(db_path: String, statements: Vec<serde_json::Value>) -> Result<serde_json::Value, String> {
    cursor_db::batch_run(&db_path, &statements)
}

// ── Command Execution ──

#[derive(Serialize)]
pub struct CommandResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
    pub error: Option<String>,
}

#[tauri::command]
pub fn exec_command(command: String) -> CommandResult {
    let shell = if cfg!(target_os = "windows") { "cmd" } else { "sh" };
    let flag = if cfg!(target_os = "windows") { "/C" } else { "-c" };

    let mut cmd = ProcessCommand::new(shell);
    cmd.args([flag, &command]);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);

    match cmd.output() {
        Ok(out) => CommandResult {
            stdout: String::from_utf8_lossy(&out.stdout).to_string(),
            stderr: String::from_utf8_lossy(&out.stderr).to_string(),
            exit_code: out.status.code(),
            error: None,
        },
        Err(e) => CommandResult {
            stdout: String::new(),
            stderr: String::new(),
            exit_code: None,
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
pub fn exec_command_async(command: String) -> Result<serde_json::Value, String> {
    let shell = if cfg!(target_os = "windows") { "cmd" } else { "sh" };
    let flag = if cfg!(target_os = "windows") { "/C" } else { "-c" };

    std::thread::spawn(move || {
        let mut cmd = ProcessCommand::new(shell);
        cmd.args([flag, &command]);
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.spawn().ok();
    });

    Ok(serde_json::json!({ "success": true, "message": "Command sent" }))
}

#[tauri::command]
pub fn spawn_detached(command: String, args: Vec<String>) -> Result<serde_json::Value, String> {
    let mut cmd = ProcessCommand::new(&command);
    cmd.args(&args);
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    match cmd.spawn() {
        Ok(child) => Ok(serde_json::json!({ "success": true, "pid": child.id() })),
        Err(e) => Err(format!("Spawn failed: {}", e)),
    }
}

// ── Process Management ──

#[tauri::command]
pub fn check_cursor_process() -> serde_json::Value {
    let status = process::check_cursor();
    serde_json::json!(status)
}

#[tauri::command]
pub fn kill_cursor_process() -> Result<serde_json::Value, String> {
    process::kill_cursor()?;
    Ok(serde_json::json!({ "success": true, "message": "Kill command sent" }))
}

#[tauri::command]
pub fn start_cursor() -> Result<serde_json::Value, String> {
    let exe_path = process::find_cursor_executable()?;
    let exe_path_clone = exe_path.clone();
    std::thread::spawn(move || {
        let mut cmd = ProcessCommand::new(&exe_path_clone);
        // 设置工作目录为 Cursor 可执行文件所在目录，避免路径相关问题
        if let Some(parent) = std::path::Path::new(&exe_path_clone).parent() {
            cmd.current_dir(parent);
        }
        #[cfg(target_os = "windows")]
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.spawn().ok();
    });
    Ok(serde_json::json!({ "success": true, "message": "Launch command sent", "path": exe_path }))
}

#[tauri::command]
pub fn find_cursor_executable_cmd() -> Result<serde_json::Value, String> {
    match process::find_cursor_executable() {
        Ok(path) => Ok(serde_json::json!({ "success": true, "path": path, "method": "rust" })),
        Err(e) => Ok(serde_json::json!({ "success": false, "error": e })),
    }
}

#[tauri::command]
pub fn find_cursor_db_cmd() -> Result<serde_json::Value, String> {
    match process::find_cursor_db() {
        Ok(paths) => {
            let found: Vec<serde_json::Value> = paths.into_iter().map(|p| {
                let meta = std::fs::metadata(&p).ok();
                serde_json::json!({
                    "path": p,
                    "size": meta.as_ref().map(|m| m.len()).unwrap_or(0),
                    "modified": meta.and_then(|m| m.modified().ok())
                        .map(|t| chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339())
                        .unwrap_or_default(),
                })
            }).collect();
            Ok(serde_json::json!({ "success": true, "foundPaths": found }))
        }
        Err(e) => Ok(serde_json::json!({ "success": false, "error": e, "foundPaths": [] })),
    }
}

// ── MAC Address ──

#[tauri::command]
pub fn get_mac_address() -> Result<String, String> {
    let out = exec_command(if cfg!(target_os = "windows") {
        "getmac /FO CSV /NH".into()
    } else if cfg!(target_os = "macos") {
        "ifconfig en0 | grep ether | awk '{print $2}'".into()
    } else {
        "cat /sys/class/net/*/address 2>/dev/null | head -1".into()
    });
    let mac = out.stdout.lines()
        .next()
        .unwrap_or("")
        .split(',')
        .next()
        .unwrap_or("")
        .trim_matches('"')
        .trim()
        .to_string();
    if mac.is_empty() || mac == "00-00-00-00-00-00" {
        // 回退到 PowerShell 获取
        let fallback = exec_command("powershell -Command \"(Get-NetAdapter | Where-Object {$_.Status -eq 'Up' -and $_.LinkLayerAddress -ne $null} | Select-Object -First 1).LinkLayerAddress\"".into());
        let fallback_mac = fallback.stdout.trim().to_string();
        if !fallback_mac.is_empty() {
            return Ok(fallback_mac);
        }
        Err("Could not determine MAC address".into())
    } else {
        Ok(mac)
    }
}

// ── Windows Registry ──

#[cfg(target_os = "windows")]
fn read_registry(key_path: &str, value_name: &str) -> Result<String, String> {
    use winreg::enums::*;
    use winreg::RegKey;

    let parts: Vec<&str> = key_path.splitn(2, '\\').collect();
    if parts.len() < 2 {
        return Err("Invalid registry path".into());
    }

    let base = match parts[0] {
        "HKLM" | "HKEY_LOCAL_MACHINE" => RegKey::predef(HKEY_LOCAL_MACHINE),
        "HKCU" | "HKEY_CURRENT_USER" => RegKey::predef(HKEY_CURRENT_USER),
        _ => return Err("Unknown registry hive".into()),
    };

    let key = base.open_subkey(parts[1]).map_err(|e| format!("Reg open failed: {}", e))?;
    let val: String = key.get_value(value_name).map_err(|e| format!("Reg get failed: {}", e))?;
    Ok(val)
}

#[cfg(not(target_os = "windows"))]
fn read_registry(_key_path: &str, _value_name: &str) -> Result<String, String> {
    Err("Registry not supported on this platform".into())
}

#[cfg(target_os = "windows")]
fn write_registry(key_path: &str, value_name: &str, value: &str) -> Result<(), String> {
    use winreg::enums::*;
    use winreg::RegKey;

    let parts: Vec<&str> = key_path.splitn(2, '\\').collect();
    if parts.len() < 2 {
        return Err("Invalid registry path".into());
    }

    let base = match parts[0] {
        "HKLM" | "HKEY_LOCAL_MACHINE" => RegKey::predef(HKEY_LOCAL_MACHINE),
        "HKCU" | "HKEY_CURRENT_USER" => RegKey::predef(HKEY_CURRENT_USER),
        _ => return Err("Unknown registry hive".into()),
    };

    let key = base.open_subkey_with_flags(parts[1], KEY_WRITE)
        .map_err(|e| format!("Reg open for write failed: {}", e))?;
    key.set_value(value_name, &value).map_err(|e| format!("Reg write failed: {}", e))
}

#[cfg(not(target_os = "windows"))]
fn write_registry(_key_path: &str, _value_name: &str, _value: &str) -> Result<(), String> {
    Err("Registry not supported on this platform".into())
}

#[tauri::command]
pub fn read_windows_registry(key_path: String, value_name: String) -> Result<serde_json::Value, String> {
    match read_registry(&key_path, &value_name) {
        Ok(val) => Ok(serde_json::json!({ "success": true, "value": val })),
        Err(e) => Ok(serde_json::json!({ "success": false, "error": e })),
    }
}

#[tauri::command]
pub fn update_windows_registry(key_path: String, value_name: String, value: String) -> Result<serde_json::Value, String> {
    match write_registry(&key_path, &value_name, &value) {
        Ok(_) => Ok(serde_json::json!({ "success": true })),
        Err(e) => {
            let needs_admin = e.contains("access") || e.contains("denied") || e.contains("5");
            Ok(serde_json::json!({ "success": false, "error": e, "needsAdmin": needs_admin }))
        }
    }
}

// ── Authentication (PKCE exchange) ──

#[tauri::command]
pub async fn exchange_session_token_for_access_token(session_token: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();

    let code_verifier = generate_code_verifier();
    let code_challenge = sha2_256_base64(&code_verifier);

    let params = [
        ("client_id", "H0us0hGO2RTCJOhBNNp7XVeWJP4AMu5P"),
        ("code_challenge", &code_challenge),
        ("code_challenge_method", "S256"),
        ("redirect_uri", "https://cursor.com"),
        ("response_type", "code"),
        ("scope", "openid profile email offline_access"),
        ("state", &Uuid::new_v4().to_string()),
    ];

    let auth_resp = client
        .post("https://cursor.com/api/auth/loginDeepCallbackControl")
        .form(&params)
        .header("Cookie", format!("WorkosCursorSessionToken={}", session_token))
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
        .await
        .map_err(|e| format!("Auth request failed: {}", e))?;

    let _auth_status = auth_resp.status();

    for _i in 0..30 {
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;

        let poll_resp = client
            .post("https://api2.cursor.sh/auth/poll")
            .json(&serde_json::json!({
                "client_id": "H0us0hGO2RTCJOhBNNp7XVeWJP4AMu5P",
                "code_verifier": code_verifier,
            }))
            .send()
            .await
            .map_err(|e| format!("Poll request failed: {}", e))?;

        if poll_resp.status().is_success() {
            let text = poll_resp.text().await.map_err(|e| format!("Poll read failed: {}", e))?;
            if !text.contains("not_ready") && !text.contains("authorization_pending") {
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                    let access_token = json["accessToken"].as_str()
                        .or_else(|| json["access_token"].as_str())
                        .unwrap_or("")
                        .to_string();
                    if !access_token.is_empty() {
                        let refresh_token = json["refreshToken"].as_str()
                            .or_else(|| json["refresh_token"].as_str())
                            .unwrap_or(&access_token)
                            .to_string();
                        return Ok(serde_json::json!({
                            "success": true,
                            "accessToken": access_token,
                            "refreshToken": refresh_token,
                            "raw": json,
                        }));
                    }
                }
            }
        }
    }

    Err("Failed to exchange session token after 30 polling attempts".into())
}

fn generate_code_verifier() -> String {
    use rand::Rng;
    let charset: Vec<u8> = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~".bytes().collect();
    let mut rng = rand::thread_rng();
    let len: usize = rng.gen_range(43..=128);
    (0..len).map(|_| charset[rng.gen_range(0..charset.len())] as char).collect()
}

fn sha2_256_base64(input: &str) -> String {
    use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
    let hash = sha2::Sha256::digest(input.as_bytes());
    URL_SAFE_NO_PAD.encode(hash)
}

// ── Admin Rights ──

#[tauri::command]
pub fn check_admin_rights() -> bool {
    #[cfg(target_os = "windows")]
    {
        let out = exec_command("net session 2>nul".into());
        return out.error.is_none() && out.exit_code == Some(0);
    }
    #[cfg(not(target_os = "windows"))]
    {
        true
    }
}

// ── Logging ──

fn log_dir() -> Result<std::path::PathBuf, String> {
    let home = get_homedir()?;
    Ok(std::path::Path::new(&home).join(".cursor-renewal-tool").join("logs"))
}

fn log_file_path() -> Result<std::path::PathBuf, String> {
    let dir = log_dir()?;
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    Ok(dir.join(format!("app-{}.log", today)))
}

#[tauri::command]
pub fn get_log_path() -> Result<serde_json::Value, String> {
    let path = log_file_path()?;
    let dir = log_dir()?;
    Ok(serde_json::json!({
        "logFile": path.to_string_lossy(),
        "logDir": dir.to_string_lossy(),
        "exists": path.exists(),
    }))
}

#[tauri::command]
pub fn read_log_file(lines: Option<usize>) -> Result<String, String> {
    let path = log_file_path()?;
    if !path.exists() {
        return Ok(String::new());
    }
    let content = std::fs::read_to_string(&path).map_err(|e| format!("Read log failed: {}", e))?;
    let lines = lines.unwrap_or(100);
    let all_lines: Vec<&str> = content.lines().collect();
    let start = if all_lines.len() > lines { all_lines.len() - lines } else { 0 };
    Ok(all_lines[start..].join("\n"))
}

#[tauri::command]
pub fn clear_log_file() -> Result<(), String> {
    let path = log_file_path()?;
    std::fs::write(&path, "").map_err(|e| format!("Clear log failed: {}", e))
}

// ── Cursor Version ──

#[tauri::command]
pub fn get_cursor_version() -> Result<String, String> {
    if let Ok(exe) = process::find_cursor_executable() {
        let exe_path = std::path::Path::new(&exe);
        
        let mut ver_found = None;

        // 方案 1: `../../resources/app/package.json`
        if ver_found.is_none() {
             let pkg_path = exe_path.parent()
                .and_then(|p| p.parent())
                .map(|p| p.join("resources").join("app").join("package.json"));
             if let Some(pkg) = pkg_path {
                 if pkg.exists() {
                     if let Ok(content) = std::fs::read_to_string(&pkg) {
                         if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                             if let Some(ver) = json["version"].as_str() {
                                 ver_found = Some(ver.to_string());
                             }
                         }
                     }
                 }
             }
        }
        
        // 方案 2: `../resources/app/package.json`
        if ver_found.is_none() {
            let pkg_path_alt = exe_path.parent()
                .map(|p| p.join("resources").join("app").join("package.json"));
            if let Some(pkg) = pkg_path_alt {
                if pkg.exists() {
                    if let Ok(content) = std::fs::read_to_string(&pkg) {
                        if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                            if let Some(ver) = json["version"].as_str() {
                                ver_found = Some(ver.to_string());
                            }
                        }
                    }
                }
            }
        }
        
        // 方案 3: `../resources/app/product.json` (新版本Cursor通常把版本写在这里)
        if ver_found.is_none() {
             let prod_path = exe_path.parent()
                .map(|p| p.join("resources").join("app").join("product.json"));
             if let Some(prod) = prod_path {
                 if prod.exists() {
                     if let Ok(content) = std::fs::read_to_string(&prod) {
                         if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                             if let Some(ver) = json["version"].as_str() {
                                 ver_found = Some(ver.to_string());
                             }
                         }
                     }
                 }
             }
        }

        // 方案 4: 直接读取同级的 `resources/app/package.json` 或 `resources/app/product.json` 
        // 应对用户自定义选择快捷方式导致的异常目录层级
        if ver_found.is_none() {
            if let Some(parent) = exe_path.parent() {
                // 有时候因为选择的是 lnk，解析后如果是直接进入了应用根目录。
                // 递归往上一两级尝试搜索 resources/app/product.json
                let mut current_dir = parent;
                for _ in 0..3 {
                    let p_prod = current_dir.join("resources").join("app").join("product.json");
                    let p_pkg = current_dir.join("resources").join("app").join("package.json");
                    
                    if p_prod.exists() {
                        if let Ok(content) = std::fs::read_to_string(&p_prod) {
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                                if let Some(ver) = json["version"].as_str() {
                                    ver_found = Some(ver.to_string());
                                    break;
                                }
                            }
                        }
                    }
                    if p_pkg.exists() {
                        if let Ok(content) = std::fs::read_to_string(&p_pkg) {
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                                if let Some(ver) = json["version"].as_str() {
                                    ver_found = Some(ver.to_string());
                                    break;
                                }
                            }
                        }
                    }
                    if let Some(p) = current_dir.parent() {
                        current_dir = p;
                    } else {
                        break;
                    }
                }
            }
        }

        if let Some(v) = ver_found {
            return Ok(v);
        }
    }
    Err("Could not determine Cursor version".into())
}

// ── Machine ID Operations (exposed for frontend) ──

#[tauri::command]
pub fn generate_machine_ids() -> serde_json::Value {
    let ids = machine_id::generate_all();
    serde_json::Value::Object(machine_id::as_json_map(&ids))
}

#[tauri::command]
pub fn reset_machine_ids_in_db(db_path: String, ids_json: serde_json::Value) -> Result<serde_json::Value, String> {
    let fields = vec![
        "telemetry.devDeviceId",
        "telemetry.machineId",
        "telemetry.macMachineId",
        "telemetry.sqmId",
        "storage.serviceMachineId",
    ];

    let mut statements = Vec::new();
    for field in &fields {
        if let Some(val) = ids_json.get(*field).and_then(|v| v.as_str()) {
            statements.push(serde_json::json!({
                "sql": "INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?1, ?2)",
                "params": [field, val],
            }));
        }
    }

    if statements.is_empty() {
        return Err("No valid IDs provided".into());
    }

    cursor_db::batch_run(&db_path, &statements)
}

#[tauri::command]
pub fn reset_storage_json(path: String, ids_json: serde_json::Value) -> Result<serde_json::Value, String> {
    let existing = if std::path::Path::new(&path).exists() {
        let content = std::fs::read_to_string(&path).unwrap_or_else(|_| "{}".into());
        serde_json::from_str(&content).unwrap_or(serde_json::Value::Object(serde_json::Map::new()))
    } else {
        serde_json::Value::Object(serde_json::Map::new())
    };

    let mut map = match existing {
        serde_json::Value::Object(ref m) => m.clone(),
        _ => serde_json::Map::new(),
    };

    let storage_fields = ["telemetry.devDeviceId", "telemetry.machineId", "telemetry.macMachineId", "telemetry.sqmId"];
    for field in &storage_fields {
        if let Some(val) = ids_json.get(*field) {
            map.insert(field.to_string(), val.clone());
        }
    }

    if cfg!(target_os = "windows") {
        remove_readonly(std::path::Path::new(&path)).ok();
    }

    let output = serde_json::to_string_pretty(&serde_json::Value::Object(map))
        .map_err(|e| format!("Serialize failed: {}", e))?;
    std::fs::write(&path, &output).map_err(|e| format!("Write storage.json failed: {}", e))?;
    Ok(serde_json::json!({ "success": true }))
}

// ── Seamless (workbench injection + HTTP server) ──

#[tauri::command]
pub fn inject_workbench() -> Result<serde_json::Value, String> {
    seamless::workbench::inject()?;
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
pub fn restore_workbench() -> Result<serde_json::Value, String> {
    seamless::workbench::restore()?;
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
pub fn get_seamless_status() -> serde_json::Value {
    let injected = seamless::workbench::is_injected().unwrap_or(false);
    let server_running = seamless::http_server::is_running();
    serde_json::json!({ "injected": injected, "serverRunning": server_running })
}

#[tauri::command]
pub fn start_http_server(port: Option<u16>) -> Result<serde_json::Value, String> {
    let p = seamless::http_server::start(port.unwrap_or(36529))?;
    Ok(serde_json::json!({ "success": true, "port": p }))
}

#[tauri::command]
pub fn stop_http_server() -> Result<serde_json::Value, String> {
    seamless::http_server::stop();
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
pub fn push_pending_switch(token: String, refresh_token: String, email: String, session_token: Option<String>) -> Result<serde_json::Value, String> {
    seamless::http_server::push_switch_with_session(token, refresh_token, email, session_token);
    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
pub async fn fetch_account_encrypted(url: String) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
        .await
        .map_err(|e| format!("API request failed: {}", e))?;

    let text = resp.text().await.map_err(|e| format!("Read response failed: {}", e))?;
    let json: serde_json::Value =
        serde_json::from_str(&text).map_err(|e| format!("JSON parse failed: {}", e))?;

    let encrypted_data = json["data"]
        .as_str()
        .ok_or_else(|| "No encrypted data in response".to_string())?;

    let decrypted = seamless::crypto::decrypt(encrypted_data)?;
    let data: serde_json::Value =
        serde_json::from_str(&decrypted).map_err(|e| format!("Decrypted JSON parse failed: {}", e))?;

    Ok(serde_json::json!({
        "success": true,
        "email": data["email"].as_str().unwrap_or(""),
        "accessToken": data["accessToken"].as_str().unwrap_or(""),
        "refreshToken": data["refreshToken"].as_str().unwrap_or(""),
    }))
}

#[tauri::command]
pub fn get_quota_status() -> serde_json::Value {
    match seamless::http_server::check_quota_debug() {
        Ok(detail) => detail,
        Err(e) => serde_json::json!({
            "error": e,
            "quotaFull": seamless::http_server::is_quota_full()
        })
    }
}

#[tauri::command]
pub fn reload_cursor_window() -> Result<serde_json::Value, String> {
    // Step 1: Kill Cursor
    let _ = process::kill_cursor();

    // Step 2: Wait for process to fully exit
    std::thread::sleep(std::time::Duration::from_millis(2000));

    // Step 3: Restart Cursor
    start_cursor()?;

    Ok(serde_json::json!({ "success": true }))
}

#[tauri::command]
pub fn debug_quota_check() -> Result<serde_json::Value, String> {
    seamless::http_server::check_quota_debug()
}
