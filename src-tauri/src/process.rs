use std::process::Command;
use serde::Serialize;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

fn no_window(cmd: &mut Command) -> &mut Command {
    #[cfg(target_os = "windows")]
    cmd.creation_flags(CREATE_NO_WINDOW);
    cmd
}

#[derive(Serialize)]
pub struct ProcessStatus {
    pub running: bool,
    pub processes: Vec<String>,
}

pub fn check_cursor() -> ProcessStatus {
    let output = if cfg!(target_os = "windows") {
        no_window(&mut Command::new("tasklist"))
            .args(["/FI", "IMAGENAME eq Cursor.exe", "/FO", "CSV", "/NH"])
            .output()
    } else if cfg!(target_os = "macos") {
        no_window(&mut Command::new("pgrep")).args(["-f", "Cursor.app"]).output()
    } else {
        no_window(&mut Command::new("pgrep")).args(["-f", "cursor"]).output()
    };

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let lines: Vec<String> = stdout.lines().map(|l| l.to_string()).collect();
            let running = if cfg!(target_os = "windows") {
                stdout.contains("Cursor.exe") && stdout.contains("\"") && !stdout.to_lowercase().contains("no tasks")
            } else {
                !stdout.trim().is_empty() && stdout.trim().chars().next().map_or(false, |c| c.is_ascii_digit())
            };
            ProcessStatus { running, processes: lines }
        }
        Err(_) => ProcessStatus { running: false, processes: vec![] },
    }
}

pub fn kill_cursor() -> Result<String, String> {
    let cmd = if cfg!(target_os = "windows") {
        "taskkill /F /IM Cursor.exe"
    } else if cfg!(target_os = "macos") {
        "pkill -9 -f 'Cursor.app'"
    } else {
        "pkill -9 -f cursor"
    };

    let (shell, arg) = if cfg!(target_os = "windows") {
        ("cmd", "/C")
    } else {
        ("sh", "-c")
    };

    no_window(&mut Command::new(shell))
        .args([arg, cmd])
        .output()
        .map_err(|e| format!("Kill failed: {}", e))?;

    Ok("Kill command sent".into())
}

/// 从配置文件中读取用户自定义的 Cursor 可执行文件路径
/// 配置文件位于 ~/.cursor-renewal-tool/config.json，字段为 cursorExecutablePath
pub fn read_custom_cursor_path() -> Option<String> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .ok()?;
    let config_path = std::path::Path::new(&home)
        .join(".cursor-renewal-tool")
        .join("config.json");
    if !config_path.exists() {
        return None;
    }
    let content = std::fs::read_to_string(&config_path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    let custom_path = json.get("cursorExecutablePath")?.as_str()?.to_string();
    if custom_path.is_empty() {
        return None;
    }
    Some(custom_path)
}

/// 查找 Cursor 可执行文件路径
/// 优先使用 custom_path 参数（如果提供），否则从配置文件读取自定义路径，
/// 最后再按默认路径搜索。支持 Windows / macOS / Linux 全平台。
pub fn find_cursor_executable_with_custom(custom_path: Option<&str>) -> Result<String, String> {
    // 1. 优先使用传入的自定义路径
    if let Some(path) = custom_path {
        if !path.is_empty() && std::path::Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }

    // 2. 从配置文件读取自定义路径
    if let Some(config_path) = read_custom_cursor_path() {
        if std::path::Path::new(&config_path).exists() {
            return Ok(config_path);
        }
        // 自定义路径可能是目录，尝试向下查找可执行文件
        let p = std::path::Path::new(&config_path);
        if cfg!(target_os = "windows") {
            // 可能传入的是 resources/app 目录或安装根目录
            let candidates = [
                p.join("Cursor.exe"),
                p.parent().unwrap_or(p).join("Cursor.exe"),
            ];
            for c in &candidates {
                if c.exists() {
                    return Ok(c.to_string_lossy().to_string());
                }
            }
            // resources/app -> resources -> Cursor 根目录
            if let Some(resources) = p.parent() {
                if let Some(root) = resources.parent() {
                    let exe = root.join("Cursor.exe");
                    if exe.exists() {
                        return Ok(exe.to_string_lossy().to_string());
                    }
                }
            }
        } else if cfg!(target_os = "macos") {
            // 可能是 .app 内部路径，向上查找 Cursor.app
            let mut dir = p;
            while let Some(parent) = dir.parent() {
                if dir.extension().map(|e| e == "app").unwrap_or(false) {
                    let macos_exe = dir.join("Contents").join("MacOS").join("Cursor");
                    if macos_exe.exists() {
                        return Ok(macos_exe.to_string_lossy().to_string());
                    }
                }
                dir = parent;
            }
        } else {
            // Linux: 尝试在目录中查找 cursor 可执行文件
            let exe = p.join("cursor");
            if exe.exists() {
                return Ok(exe.to_string_lossy().to_string());
            }
        }
        // 配置的路径无效，继续 fallback 到默认搜索
    }

    // 3. 默认路径搜索（原有逻辑）
    if cfg!(target_os = "windows") {
        let paths = [
            format!("{}\\AppData\\Local\\Programs\\Cursor\\Cursor.exe", std::env::var("USERPROFILE").unwrap_or_default()),
            "C:\\Program Files\\Cursor\\Cursor.exe".into(),
            "C:\\Program Files (x86)\\Cursor\\Cursor.exe".into(),
        ];
        for p in &paths {
            if std::path::Path::new(p).exists() {
                return Ok(p.clone());
            }
        }
        let output = no_window(&mut Command::new("cmd"))
            .args(["/C", "where cursor 2>nul || echo not_found"])
            .output()
            .map_err(|e| format!("where command failed: {}", e))?;
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if stdout != "not_found" && !stdout.is_empty() {
            return Ok(stdout.lines().next().unwrap_or("").to_string());
        }
        Err("Cursor executable not found".into())
    } else if cfg!(target_os = "macos") {
        let path = "/Applications/Cursor.app/Contents/MacOS/Cursor";
        if std::path::Path::new(path).exists() {
            Ok(path.into())
        } else {
            Err("Cursor not found at /Applications".into())
        }
    } else {
        // Linux
        let paths = [
            "/usr/bin/cursor",
            "/usr/local/bin/cursor",
            "/opt/cursor/cursor",
        ];
        for p in &paths {
            if std::path::Path::new(p).exists() {
                return Ok(p.to_string());
            }
        }
        Err("Cursor executable not found".into())
    }
}

/// 兼容旧调用：无参版本，自动从配置文件读取自定义路径
pub fn find_cursor_executable() -> Result<String, String> {
    find_cursor_executable_with_custom(None)
}

pub fn find_cursor_db() -> Result<Vec<String>, String> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| "Cannot determine home directory".to_string())?;

    let candidates = if cfg!(target_os = "windows") {
        vec![
            format!("{}\\AppData\\Roaming\\Cursor\\User\\globalStorage\\state.vscdb", home),
        ]
    } else if cfg!(target_os = "macos") {
        vec![
            format!("{}/Library/Application Support/Cursor/User/globalStorage/state.vscdb", home),
        ]
    } else {
        vec![
            format!("{}/.config/cursor/User/globalStorage/state.vscdb", home),
        ]
    };

    let found: Vec<String> = candidates.into_iter()
        .filter(|p| std::path::Path::new(p).exists())
        .collect();

    if found.is_empty() {
        Err("No Cursor database found".into())
    } else {
        Ok(found)
    }
}
