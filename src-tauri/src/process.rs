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
        "pkill -9 -f 'Cursor.app' ; pkill -9 -x Cursor"
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

/// 将可能的用户输入路径（如 Cursor.app 目录、安装目录或可执行文件本身）转换为实际的二进制可执行文件路径
pub fn resolve_cursor_executable(path_str: &str) -> Option<String> {
    if path_str.is_empty() {
        return None;
    }
    let p = std::path::Path::new(path_str);
    if !p.exists() {
        return None;
    }

    if cfg!(target_os = "macos") {
        // 1. 如果直接是指向真正的二进制文件
        if p.is_file() {
            return Some(p.to_string_lossy().to_string());
        }
        // 2. 如果是 Cursor.app 目录
        let app_exe = p.join("Contents").join("MacOS").join("Cursor");
        if app_exe.exists() {
            return Some(app_exe.to_string_lossy().to_string());
        }
        // 3. 可能是 .app 内的子目录，向上追溯查找
        let mut dir = p;
        while let Some(parent) = dir.parent() {
            if dir.extension().map(|e| e == "app").unwrap_or(false) {
                let macos_exe = dir.join("Contents").join("MacOS").join("Cursor");
                if macos_exe.exists() {
                    return Some(macos_exe.to_string_lossy().to_string());
                }
            }
            dir = parent;
        }
    } else if cfg!(target_os = "windows") {
        if p.is_file() {
            return Some(p.to_string_lossy().to_string());
        }
        let candidates = [
            p.join("Cursor.exe"),
            p.parent().unwrap_or(p).join("Cursor.exe"),
        ];
        for c in &candidates {
            if c.exists() && c.is_file() {
                return Some(c.to_string_lossy().to_string());
            }
        }
        if let Some(resources) = p.parent() {
            if let Some(root) = resources.parent() {
                let exe = root.join("Cursor.exe");
                if exe.exists() && exe.is_file() {
                    return Some(exe.to_string_lossy().to_string());
                }
            }
        }
    } else {
        // Linux
        if p.is_file() {
            return Some(p.to_string_lossy().to_string());
        }
        let exe = p.join("cursor");
        if exe.exists() && exe.is_file() {
            return Some(exe.to_string_lossy().to_string());
        }
    }

    // fallback: 如果本身是文件，直接返回
    if p.is_file() {
        Some(p.to_string_lossy().to_string())
    } else {
        None
    }
}

/// 查找 Cursor 可执行文件路径
/// 优先使用 custom_path 参数（如果提供），否则从配置文件读取自定义路径，
/// 最后再按默认路径搜索。支持 Windows / macOS / Linux 全平台。
pub fn find_cursor_executable_with_custom(custom_path: Option<&str>) -> Result<String, String> {
    // 1. 优先使用传入的自定义路径
    if let Some(path) = custom_path {
        if let Some(resolved) = resolve_cursor_executable(path) {
            return Ok(resolved);
        }
    }

    // 2. 从配置文件读取自定义路径
    if let Some(config_path) = read_custom_cursor_path() {
        if let Some(resolved) = resolve_cursor_executable(&config_path) {
            return Ok(resolved);
        }
    }

    // 3. 默认路径搜索
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
        let mut macos_candidates = vec![
            "/Applications/Cursor.app/Contents/MacOS/Cursor".to_string(),
        ];
        if let Ok(home) = std::env::var("HOME") {
            macos_candidates.push(format!("{}/Applications/Cursor.app/Contents/MacOS/Cursor", home));
        }
        for p in &macos_candidates {
            if std::path::Path::new(p).exists() {
                return Ok(p.clone());
            }
        }

        // 尝试从正在运行的进程中探测 Cursor 路径（优先排除 /Volumes/ 临时挂载卷）
        let mut fallback_volume_exe: Option<String> = None;
        if let Ok(out) = Command::new("pgrep").args(["-f", "Cursor.app"]).output() {
            let pids = String::from_utf8_lossy(&out.stdout);
            for pid in pids.lines().map(|s| s.trim()).filter(|s| !s.is_empty()) {
                if let Ok(comm_out) = Command::new("ps").args(["-p", pid, "-o", "comm="]).output() {
                    let exe_line = String::from_utf8_lossy(&comm_out.stdout).trim().to_string();
                    if !exe_line.is_empty() && std::path::Path::new(&exe_line).exists() && exe_line.contains("Cursor") {
                        if !exe_line.starts_with("/Volumes/") {
                            return Ok(exe_line);
                        } else if fallback_volume_exe.is_none() {
                            fallback_volume_exe = Some(exe_line);
                        }
                    }
                }
            }
        }

        // 尝试使用 mdfind 定位 Cursor.app（优先排除 /Volumes/ 临时挂载卷）
        if let Ok(out) = Command::new("mdfind").args(["kMDItemCFBundleIdentifier == 'com.todesktop.230313mzl4w4u92' || kMDItemFSName == 'Cursor.app'"]).output() {
            let mdfind_res = String::from_utf8_lossy(&out.stdout);
            for line in mdfind_res.lines() {
                let trimmed = line.trim();
                if trimmed.ends_with(".app") {
                    let exe = std::path::Path::new(trimmed).join("Contents").join("MacOS").join("Cursor");
                    if exe.exists() {
                        let exe_str = exe.to_string_lossy().to_string();
                        if !exe_str.starts_with("/Volumes/") {
                            return Ok(exe_str);
                        } else if fallback_volume_exe.is_none() {
                            fallback_volume_exe = Some(exe_str);
                        }
                    }
                }
            }
        }

        if let Some(vol_exe) = fallback_volume_exe {
            return Ok(vol_exe);
        }

        Err("Cursor not found at /Applications or ~/Applications".into())
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_cursor_executable_empty() {
        assert!(resolve_cursor_executable("").is_none());
        assert!(resolve_cursor_executable("non_existent_path_12345").is_none());
    }

    #[test]
    fn test_resolve_cursor_executable_file() {
        let temp = std::env::temp_dir().join(format!("cursor_proc_test_{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&temp).unwrap();
        let fake_exe = temp.join("Cursor.exe");
        std::fs::write(&fake_exe, "binary").unwrap();

        // 传入文件自身
        let res = resolve_cursor_executable(&fake_exe.to_string_lossy());
        assert!(res.is_some());

        // 传入包含该 exe 的目录
        let res_dir = resolve_cursor_executable(&temp.to_string_lossy());
        assert!(res_dir.is_some());

        let _ = std::fs::remove_dir_all(&temp);
    }
}
