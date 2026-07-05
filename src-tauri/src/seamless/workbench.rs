use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

const SEAMLESS_MARKER: &str = "/* __CURSOR_XUBEI__ */";
const BACKUP_SUFFIX: &str = ".backup.xubei";

static INJECTED: Mutex<bool> = Mutex::new(false);

fn find_workbench_path() -> Result<PathBuf, String> {
    let exe = crate::process::find_cursor_executable()?;
    let exe_path = std::path::Path::new(&exe);
    // Cursor.exe is at ...\Cursor\Cursor.exe
    // workbench.desktop.main.js is at ...\Cursor\resources\app\out\vs\workbench\
    let js = exe_path
        .parent()
        .map(|p| {
            p.join("resources")
                .join("app")
                .join("out")
                .join("vs")
                .join("workbench")
                .join("workbench.desktop.main.js")
        });
    match js {
        Some(p) if p.exists() => Ok(p),
        Some(p) => Err(format!("workbench.desktop.main.js not found at: {}", p.display())),
        None => Err("Cannot derive path from Cursor executable".into()),
    }
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
if(d.token&&window.__xbAuth){{
var auth=window.__xbAuth;

// Property assignment (NOT function call) — matches Cursor's AuthService API
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

// Update sidebar email display
var emailEl=document.querySelector(".cursor-settings-sidebar-header-email");
if(emailEl&&d.email)emailEl.textContent=d.email;

// Ack
fetch("http://127.0.0.1:"+P+"/api/pending-switch/ack",{{method:"POST"}}).catch(function(){{}});
}}
}}catch(e){{}}
}},1000);

// Hook fetch for chat-complete event detection
var origFetch=window.fetch.bind(window);
window.fetch=async function(){{
var args=arguments;
var res=await origFetch.apply(this,args);
try{{
var url=typeof args[0]==="string"?args[0]:(args[0]&&args[0].url)||"";
if(url.indexOf("api2.cursor.sh")>=0||url.indexOf("cursor.sh/aiserver")>=0){{
res.clone().text().then(function(){{
origFetch("http://127.0.0.1:"+P+"/api/chat-complete",{{method:"POST"}}).catch(function(){{}});
}}).catch(function(){{}});
}}
}}catch(e){{}}
return res;
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
        fs::write(&backup, &content).map_err(|e| format!("Backup failed: {}", e))?;
    }

    // Hook: addLoginChangedListener — expose AuthService as window.__xbAuth
    // Actual Cursor code uses variable 'n', not 'e'
    let hook_old = "addLoginChangedListener(n){this.loginChangedListeners.push(n)}";
    let hook_new = "addLoginChangedListener(n){this.loginChangedListeners.push(n);window.__xbAuth=this}";
    let step1 = content.replace(hook_old, hook_new);

    // Step 2: Append injection script
    let step2 = format!("{}{}", step1, injection_script(port));

    fs::write(&path, &step2).map_err(|e| format!("Write failed: {}", e))?;

    let mut flag = INJECTED.lock().map_err(|e| e.to_string())?;
    *flag = true;

    Ok(())
}

pub fn restore() -> Result<(), String> {
    let path = find_workbench_path()?;
    let backup = path.with_extension(BACKUP_SUFFIX);
    if !backup.exists() {
        return Err("Backup not found".into());
    }
    let backup_content = fs::read_to_string(&backup).map_err(|e| format!("Read backup failed: {}", e))?;
    fs::write(&path, &backup_content).map_err(|e| format!("Restore failed: {}", e))?;
    fs::remove_file(&backup).ok();
    let mut flag = INJECTED.lock().map_err(|e| e.to_string())?;
    *flag = false;
    Ok(())
}

pub fn is_injected() -> Result<bool, String> {
    let path = find_workbench_path()?;
    let content = fs::read_to_string(&path).map_err(|e| format!("Read failed: {}", e))?;
    Ok(content.contains(SEAMLESS_MARKER))
}
