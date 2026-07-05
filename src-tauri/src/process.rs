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

pub fn find_cursor_executable() -> Result<String, String> {
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
        Err("Unsupported platform".into())
    }
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
