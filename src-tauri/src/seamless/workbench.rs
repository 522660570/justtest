use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

const SEAMLESS_MARKER: &str = "/* __CURSOR_XUBEI__ */";
const BACKUP_SUFFIX: &str = ".backup.xubei";

static INJECTED: Mutex<bool> = Mutex::new(false);

fn probe_workbench_from_path(start_path: &std::path::Path) -> Option<PathBuf> {
    let mut current: Option<&std::path::Path> = Some(start_path);
    let mut depth = 0;
    while let Some(dir) = current {
        if depth > 6 {
            break;
        }

        #[cfg(target_os = "macos")]
        let candidates = [
            // macOS: Contents/Resources/app/...
            dir.join("Contents").join("Resources").join("app").join("out").join("vs").join("workbench").join("workbench.desktop.main.js"),
            dir.join("Resources").join("app").join("out").join("vs").join("workbench").join("workbench.desktop.main.js"),
            dir.join("resources").join("app").join("out").join("vs").join("workbench").join("workbench.desktop.main.js"),
            dir.join("app").join("out").join("vs").join("workbench").join("workbench.desktop.main.js"),
            dir.join("out").join("vs").join("workbench").join("workbench.desktop.main.js"),
            dir.join("vs").join("workbench").join("workbench.desktop.main.js"),
            dir.join("workbench").join("workbench.desktop.main.js"),
            dir.join("workbench.desktop.main.js"),
        ];

        #[cfg(not(target_os = "macos"))]
        let candidates = [
            // Windows / Linux: resources/app/...
            dir.join("resources").join("app").join("out").join("vs").join("workbench").join("workbench.desktop.main.js"),
            dir.join("Contents").join("Resources").join("app").join("out").join("vs").join("workbench").join("workbench.desktop.main.js"),
            dir.join("Resources").join("app").join("out").join("vs").join("workbench").join("workbench.desktop.main.js"),
            dir.join("app").join("out").join("vs").join("workbench").join("workbench.desktop.main.js"),
            dir.join("out").join("vs").join("workbench").join("workbench.desktop.main.js"),
            dir.join("vs").join("workbench").join("workbench.desktop.main.js"),
            dir.join("workbench").join("workbench.desktop.main.js"),
            dir.join("workbench.desktop.main.js"),
        ];

        for c in &candidates {
            if c.exists() && c.is_file() {
                return Some(c.clone());
            }
        }

        current = dir.parent();
        depth += 1;
    }
    None
}

pub fn find_workbench_path() -> Result<PathBuf, String> {
    // 策略1: 优先从检测到的 Cursor 可执行文件路径推导
    if let Ok(exe) = crate::process::find_cursor_executable() {
        let exe_path = std::path::Path::new(&exe);
        if let Some(found) = probe_workbench_from_path(exe_path) {
            return Ok(found);
        }
    }

    // 策略2: 从用户可能配置的自定义路径推导
    let custom_path = crate::process::read_custom_cursor_path();
    if let Some(ref custom) = custom_path {
        let p = std::path::Path::new(custom);
        if let Some(found) = probe_workbench_from_path(p) {
            return Ok(found);
        }
    }

    // 策略3: macOS 常见默认安装位置 fallback
    #[cfg(target_os = "macos")]
    {
        let macos_defaults = [
            "/Applications/Cursor.app",
            "/Applications/Cursor.app/Contents/Resources/app/out/vs/workbench/workbench.desktop.main.js",
        ];
        for d in &macos_defaults {
            let p = std::path::Path::new(d);
            if let Some(found) = probe_workbench_from_path(p) {
                return Ok(found);
            }
        }
        if let Ok(home) = std::env::var("HOME") {
            let user_mac = format!("{}/Applications/Cursor.app", home);
            let p = std::path::Path::new(&user_mac);
            if let Some(found) = probe_workbench_from_path(p) {
                return Ok(found);
            }
        }
    }

    // 所有策略均失败
    let tried_info = format!("custom_path={:?}", custom_path);
    Err(format!("workbench.desktop.main.js not found. Tried probing ancestors. Context: {}", tried_info))
}

fn injection_script(port: u16) -> String {
    format!(
        r#"
/* __CURSOR_XUBEI__ */
;(function xubeiSeamless(){{
if(typeof window.__xubeiLoaded!=="undefined")return;
window.__xubeiLoaded=true;
var P={port};

// Poll for pending switch
setInterval(async function(){{
try{{
var r=await fetch("http://127.0.0.1:"+P+"/api/pending-switch");
var d=await r.json();
if(d.token && d.token !== window.__xbToken){{
window.__xbToken=d.token; // Store token globally for fetch interceptor
if(window.__xbAuth){{
var auth=window.__xbAuth;

// Property assignment (NOT function call) matches Cursor's AuthService API
auth.localOverrideAccessToken=d.token;

// Override refreshToken getter
if(d.refresh_token){{
  auth.refreshToken=function(){{return d.refresh_token}};
}}

// Patch storeAccessRefreshToken to intercept token refresh
if(!auth.__xubeiPatched){{
  auth.__xubeiPatched=true;
  auth.storeAccessRefreshToken=function(r,s){{auth.localOverrideAccessToken=r}};
}}

// Override machine IDs in runtime memory
if(d.machine_ids){{
  var mi=d.machine_ids;
  if(mi["telemetry.machineId"])auth._machineId=mi["telemetry.machineId"];
  if(mi["telemetry.macMachineId"])auth._macMachineId=mi["telemetry.macMachineId"];
}}

// Notify Cursor that login state changed
auth.notifyLoginChangedListeners(true);
}}

// Update sidebar email display
var emailEl=document.querySelector(".cursor-settings-sidebar-header-email");
if(emailEl&&d.email)emailEl.textContent=d.email;

// DO NOT ACK. Let the server hold the state so that other windows (like Composer vs Editor)
// can all independently poll and receive the switch event.
// fetch("http://127.0.0.1:"+P+"/api/pending-switch/ack",{{method:"POST"}}).catch(function(){{}});
}}
}}catch(e){{}}
}},1000);

// Hook fetch for chat-complete event detection and token injection
var origFetch=window.fetch.bind(window);
window.fetch=async function(){{
var args=Array.prototype.slice.call(arguments);
try{{
var url=typeof args[0]==="string"?args[0]:(args[0]&&args[0].url)||"";

// Attempt to globally sync the token with the internal extension host if possible.
// Cursor passes the token down to extensions and other processes.
if (window.__xbToken && window.__xbToken !== localStorage.getItem("cursorAuthToken")) {{
  try {{
      localStorage.setItem("cursorAuthToken", window.__xbToken);
  }} catch(e) {{}}
}}

if (window.__xbToken && (url.indexOf("api2.cursor.sh")>=0||url.indexOf("cursor.sh/")>=0)) {{
  if (typeof args[0] === "string") {{
    args[1] = args[1] || {{}};
    args[1].headers = args[1].headers || {{}};
    if (args[1].headers instanceof Headers) {{
      args[1].headers.set("Authorization", "Bearer " + window.__xbToken);
    }} else if (Array.isArray(args[1].headers)) {{
      var found = false;
      for (var i = 0; i < args[1].headers.length; i++) {{
        if (args[1].headers[i][0].toLowerCase() === "authorization") {{
          args[1].headers[i][1] = "Bearer " + window.__xbToken;
          found = true;
          break;
        }}
      }}
      if (!found) args[1].headers.push(["Authorization", "Bearer " + window.__xbToken]);
    }} else {{
      args[1].headers["Authorization"] = "Bearer " + window.__xbToken;
    }}
  }} else if (args[0] instanceof Request) {{
    // Cannot easily modify Request headers after creation without cloning
    var newReq = new Request(args[0]);
    newReq.headers.set("Authorization", "Bearer " + window.__xbToken);
    args[0] = newReq;
  }}
}}

var res=await origFetch.apply(this,args);
if(url.indexOf("api2.cursor.sh")>=0||url.indexOf("cursor.sh/aiserver")>=0){{
res.clone().text().then(function(){{
// Send an asynchronous notification. Do not block.
origFetch("http://127.0.0.1:"+P+"/api/chat-complete",{{method:"POST"}}).catch(function(){{}});
}}).catch(function(){{}});
}}
// Handle 401 Unauthorized globally: might need a token refresh
if (res.status === 401 && window.__xbToken) {{
  // Optional: Trigger a refresh or a notification to the manager here if needed.
}}
return res;
}}catch(e){{
return origFetch.apply(this,arguments);
}}
}};

// Patch XMLHttpRequest to inject tokens as well (Composer window might use XHR for some requests)
var origXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function() {{
    var xhr = new origXHR();
    var origOpen = xhr.open;
    var origSend = xhr.send;
    var requestUrl = "";
    
    xhr.open = function(method, url) {{
        requestUrl = url;
        return origOpen.apply(this, arguments);
    }};
    
    xhr.send = function() {{
        if (window.__xbToken && typeof requestUrl === "string" && (requestUrl.indexOf("api2.cursor.sh")>=0 || requestUrl.indexOf("cursor.sh/")>=0)) {{
            xhr.setRequestHeader("Authorization", "Bearer " + window.__xbToken);
        }}
        return origSend.apply(this, arguments);
    }};
    
    return xhr;
}};
}})();
"#,
        port = port
    )
}

pub fn inject() -> Result<(), String> {
    inject_with_port(36529)
}

pub fn inject_with_port(port: u16) -> Result<(), String> {
    let path = find_workbench_path()?;
    let content = fs::read_to_string(&path).map_err(|e| format!("Read failed: {}", e))?;

    if content.contains(SEAMLESS_MARKER) {
        INJECTED.lock().map_err(|e| e.to_string())?.clone_from(&true);
        return Ok(());
    }

    // Backup
    let backup = path.with_extension(BACKUP_SUFFIX);
    if !backup.exists() {
        if let Err(e) = fs::write(&backup, &content) {
            let path_str = path.to_string_lossy();
            let is_ro = e.raw_os_error() == Some(30) || e.to_string().contains("Read-only file system");
            let err_msg = if is_ro || path_str.starts_with("/Volumes/") {
                format!("Backup failed: 只读文件系统 (os error 30)。检测到 Cursor 位于只读卷（如 DMG 镜像，路径: {}），请将 Cursor 拖入“应用程序”文件夹: {}", path_str, e)
            } else {
                format!("Backup failed: {}", e)
            };
            return Err(err_msg);
        }
    }

    // Hook: addLoginChangedListener — expose AuthService as window.__xbAuth
    // Actual Cursor code uses variable 'n', not 'e'
    let hook_old = "addLoginChangedListener(n){this.loginChangedListeners.push(n)}";
    let hook_new = "addLoginChangedListener(n){this.loginChangedListeners.push(n);window.__xbAuth=this}";
    let step1 = content.replace(hook_old, hook_new);

    // Step 2: Append injection script
    let step2 = format!("{}{}", step1, injection_script(port));

    if let Err(e) = fs::write(&path, &step2) {
        let path_str = path.to_string_lossy();
        let is_ro = e.raw_os_error() == Some(30) || e.to_string().contains("Read-only file system");
        let err_msg = if is_ro || path_str.starts_with("/Volumes/") {
            format!("Write failed: 只读文件系统 (os error 30)。检测到 Cursor 位于只读卷（如 DMG 镜像，路径: {}），请将 Cursor 拖入“应用程序”文件夹: {}", path_str, e)
        } else {
            format!("Write failed: {}", e)
        };
        return Err(err_msg);
    }

    // Also attempt to inject into workbench.glass.main.js (Composer window)
    if let Some(parent) = path.parent() {
        let glass_path = parent.join("workbench.glass.main.js");
        if glass_path.exists() {
            if let Ok(glass_content) = fs::read_to_string(&glass_path) {
                if !glass_content.contains(SEAMLESS_MARKER) {
                    let glass_backup = glass_path.with_extension(BACKUP_SUFFIX);
                    if !glass_backup.exists() {
                        let _ = fs::write(&glass_backup, &glass_content);
                    }
                    let glass_step1 = glass_content.replace(hook_old, hook_new);
                    let glass_step2 = format!("{}{}", glass_step1, injection_script(port));
                    let _ = fs::write(&glass_path, &glass_step2);
                }
            }
        }
    }

    let mut flag = INJECTED.lock().map_err(|e| e.to_string())?;
    *flag = true;

    Ok(())
}

pub fn restore() -> Result<(), String> {
    let path = find_workbench_path()?;
    
    // Restore workbench.desktop.main.js
    let backup = path.with_extension(BACKUP_SUFFIX);
    if !backup.exists() {
        return Err("Backup not found".into());
    }
    let backup_content = fs::read_to_string(&backup).map_err(|e| format!("Read backup failed: {}", e))?;
    fs::write(&path, &backup_content).map_err(|e| format!("Restore failed: {}", e))?;
    fs::remove_file(&backup).ok();

    // Restore workbench.glass.main.js if it exists
    if let Some(parent) = path.parent() {
        let glass_path = parent.join("workbench.glass.main.js");
        let glass_backup = glass_path.with_extension(BACKUP_SUFFIX);
        if glass_backup.exists() {
            if let Ok(glass_backup_content) = fs::read_to_string(&glass_backup) {
                let _ = fs::write(&glass_path, &glass_backup_content);
                let _ = fs::remove_file(&glass_backup);
            }
        }
    }

    let mut flag = INJECTED.lock().map_err(|e| e.to_string())?;
    *flag = false;
    Ok(())
}

pub fn is_injected() -> Result<bool, String> {
    let path = find_workbench_path()?;
    let content = fs::read_to_string(&path).map_err(|e| format!("Read failed: {}", e))?;
    Ok(content.contains(SEAMLESS_MARKER))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_probe_workbench_macos_structure() {
        let temp = std::env::temp_dir().join(format!("cursor_test_mac_{}", uuid::Uuid::new_v4()));
        let macos_dir = temp.join("Cursor.app").join("Contents").join("MacOS");
        let resources_dir = temp.join("Cursor.app").join("Contents").join("Resources").join("app").join("out").join("vs").join("workbench");
        fs::create_dir_all(&macos_dir).unwrap();
        fs::create_dir_all(&resources_dir).unwrap();

        let fake_exe = macos_dir.join("Cursor");
        fs::write(&fake_exe, "fake binary").unwrap();

        let target_js = resources_dir.join("workbench.desktop.main.js");
        fs::write(&target_js, "/* fake workbench */").unwrap();

        // 1. 从二进制可执行文件路径测试向上探测
        let found = probe_workbench_from_path(&fake_exe);
        assert!(found.is_some(), "应当能从 Contents/MacOS/Cursor 找到 Resources 目录下的 workbench");
        assert!(found.as_ref().unwrap().exists());
        assert_eq!(
            fs::read_to_string(found.unwrap()).unwrap(),
            "/* fake workbench */"
        );

        // 2. 从 Cursor.app 目录测试探测
        let found_app = probe_workbench_from_path(&temp.join("Cursor.app"));
        assert!(found_app.is_some(), "应当能从 Cursor.app 找到 workbench");
        assert!(found_app.as_ref().unwrap().exists());
        assert_eq!(
            fs::read_to_string(found_app.unwrap()).unwrap(),
            "/* fake workbench */"
        );

        // 清理临时目录
        let _ = fs::remove_dir_all(&temp);
    }

    #[test]
    fn test_probe_workbench_windows_structure() {
        let temp = std::env::temp_dir().join(format!("cursor_test_win_{}", uuid::Uuid::new_v4()));
        let install_dir = temp.join("Cursor");
        let resources_dir = install_dir.join("resources").join("app").join("out").join("vs").join("workbench");
        fs::create_dir_all(&resources_dir).unwrap();

        let fake_exe = install_dir.join("Cursor.exe");
        fs::write(&fake_exe, "fake exe").unwrap();

        let target_js = resources_dir.join("workbench.desktop.main.js");
        fs::write(&target_js, "/* fake workbench */").unwrap();

        // 从 Cursor.exe 测试探测
        let found = probe_workbench_from_path(&fake_exe);
        assert!(found.is_some(), "应当能从 Cursor.exe 找到 resources 目录下的 workbench");
        assert!(found.as_ref().unwrap().exists());
        assert_eq!(
            fs::read_to_string(found.unwrap()).unwrap(),
            "/* fake workbench */"
        );

        let _ = fs::remove_dir_all(&temp);
    }
}
