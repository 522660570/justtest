use std::sync::{
    atomic::{AtomicBool, Ordering},
    Mutex,
};
use std::thread;
use serde_json::json;
use tiny_http::{Header, Response, Server};

// ── State ──────────────────────────────────────────────────────────────

static SERVER_RUNNING: AtomicBool = AtomicBool::new(false);

struct SwitchState {
    token: Option<String>,
    refresh_token: Option<String>,
    email: Option<String>,
}

static SWITCH: once_cell::sync::Lazy<Mutex<SwitchState>> =
    once_cell::sync::Lazy::new(|| {
        Mutex::new(SwitchState {
            token: None,
            refresh_token: None,
            email: None,
        })
    });

static ACCESS_TOKEN: once_cell::sync::Lazy<Mutex<Option<String>>> =
    once_cell::sync::Lazy::new(|| Mutex::new(None));

static SESSION_TOKEN: once_cell::sync::Lazy<Mutex<Option<String>>> =
    once_cell::sync::Lazy::new(|| Mutex::new(None));

static QUOTA_FULL: once_cell::sync::Lazy<Mutex<bool>> =
    once_cell::sync::Lazy::new(|| Mutex::new(false));

// ── Headers ────────────────────────────────────────────────────────────

fn cors_headers() -> Vec<Header> {
    vec![
        Header::from_bytes("Access-Control-Allow-Origin", "*").unwrap(),
        Header::from_bytes("Access-Control-Allow-Methods", "GET, POST, OPTIONS").unwrap(),
        Header::from_bytes("Access-Control-Allow-Headers", "*").unwrap(),
        Header::from_bytes("Content-Type", "application/json").unwrap(),
    ]
}

fn json_response(body: &str) -> Response<std::io::Cursor<Vec<u8>>> {
    let mut resp = Response::from_string(body);
    for h in cors_headers() {
        resp.add_header(h);
    }
    resp
}

// ── Request handling ───────────────────────────────────────────────────

fn handle_request(
    mut req: tiny_http::Request,
    _app_handle: Option<&tauri::AppHandle>,
) {
    let url = req.url().to_string();
    let method = req.method().as_str().to_string();

    // CORS preflight
    if method == "OPTIONS" {
        let resp = json_response("{}");
        let _ = req.respond(resp);
        return;
    }

    match (method.as_str(), url.as_str()) {
        ("GET", "/api/health") => {
            let resp = json_response(r#"{"status":"ok"}"#);
            let _ = req.respond(resp);
        }

        ("GET", "/api/pending-switch") => {
            let state = SWITCH.lock().unwrap();
            if let Some(ref token) = state.token {
                let resp = json_response(
                    &json!({ "token": token, "refresh_token": state.refresh_token.as_deref(), "email": state.email.as_deref() }).to_string(),
                );
                let _ = req.respond(resp);
            } else {
                let resp = json_response(r#"{"token":null}"#);
                let _ = req.respond(resp);
            }
        }

        ("POST", "/api/pending-switch") => {
            let mut body = String::new();
            if req.as_reader().read_to_string(&mut body).is_ok() {
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(&body) {
                    let mut state = SWITCH.lock().unwrap();
                    state.token = v["token"].as_str().map(|s| s.to_string());
                    state.refresh_token = v["refresh_token"].as_str().map(|s| s.to_string());
                    state.email = v["email"].as_str().map(|s| s.to_string());
                    if let Some(ref t) = state.token {
                        *ACCESS_TOKEN.lock().unwrap() = Some(t.clone());
                    }
                    // Store session_token in memory only (never written to disk)
                    if let Some(s) = v["session_token"].as_str() {
                        *SESSION_TOKEN.lock().unwrap() = Some(s.to_string());
                    }
                }
            }
            let resp = json_response(r#"{"success":true}"#);
            let _ = req.respond(resp);
        }

        ("POST", "/api/pending-switch/ack") => {
            let mut state = SWITCH.lock().unwrap();
            state.token = None;
            state.refresh_token = None;
            state.email = None;
            let resp = json_response(r#"{"success":true}"#);
            let _ = req.respond(resp);
        }

        ("POST", "/api/chat-complete") => {
            let resp = json_response(r#"{"success":true}"#);
            let _ = req.respond(resp);

            // Async quota check using in-memory session_token
            let token = SESSION_TOKEN.lock().unwrap().clone();
            thread::spawn(move || {
                if let Some(t) = token {
                    check_quota(&t);
                }
            });
        }

        ("GET", "/api/quota-status") => {
            let full = *QUOTA_FULL.lock().unwrap();
            let resp = json_response(&json!({ "quotaFull": full }).to_string());
            let _ = req.respond(resp);
        }

        _ => {
            let resp = json_response(r#"{"error":"not found"}"#);
            let _ = req.respond(resp.with_status_code(404));
        }
    }
}

fn check_quota(session_token: &str) {
    let client = match reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
    {
        Ok(c) => c,
        Err(e) => { eprintln!("[check_quota] build client error: {}", e); return; }
    };

    let resp = match client
        .get("https://cursor.com/api/usage-summary")
        .header("Cookie", format!("WorkosCursorSessionToken={}", session_token))
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
    {
        Ok(r) => r,
        Err(e) => { eprintln!("[check_quota] request error: {}", e); return; }
    };

    let status = resp.status().as_u16();
    if status == 401 {
        eprintln!("[check_quota] 401 Unauthorized — session token invalid");
        return;
    }

    let body = match resp.text() {
        Ok(t) => t,
        Err(e) => { eprintln!("[check_quota] read body error: {}", e); return; }
    };

    eprintln!("[check_quota] response status={}, body={}", status, body);

    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&body) {
        // Check gpt4 usage (legacy path)
        let gpt4_total = json["gpt4"]["numRequestsTotal"].as_u64().unwrap_or(0);
        let gpt4_max = json["gpt4"]["maxRequestUsage"].as_u64().unwrap_or(u64::MAX);
        
        // New API structure: individualUsage.plan.autoPercentUsed / apiPercentUsed
        let api_pct = json["individualUsage"]["plan"]["apiPercentUsed"]
            .as_f64()
            .unwrap_or(0.0);
        let auto_pct = json["individualUsage"]["plan"]["autoPercentUsed"]
            .as_f64()
            .unwrap_or(0.0);
        
        let is_full = gpt4_total >= gpt4_max || api_pct >= 100.0 || auto_pct >= 100.0;

        eprintln!("[check_quota] gpt4={}/{} api={}% auto={}% full={}",
            gpt4_total, gpt4_max, api_pct, auto_pct, is_full);

        let mut qf = QUOTA_FULL.lock().unwrap();
        *qf = is_full;
    } else {
        eprintln!("[check_quota] failed to parse response as JSON");
    }
}

// ── Server lifecycle ───────────────────────────────────────────────────

pub fn start(port: u16) -> Result<u16, String> {
    if SERVER_RUNNING.load(Ordering::SeqCst) {
        return Ok(port);
    }

    let addr = format!("127.0.0.1:{}", port);
    let server = Server::http(&addr).map_err(|e| format!("Server start failed: {}", e))?;
    let actual_port = server.server_addr().to_ip().map(|a| a.port()).unwrap_or(port);

    SERVER_RUNNING.store(true, Ordering::SeqCst);

    thread::spawn(move || {
        while SERVER_RUNNING.load(Ordering::SeqCst) {
            match server.recv() {
                Ok(req) => handle_request(req, None),
                Err(_) => break,
            }
        }
    });

    Ok(actual_port)
}

pub fn stop() {
    SERVER_RUNNING.store(false, Ordering::SeqCst);
}

pub fn is_running() -> bool {
    SERVER_RUNNING.load(Ordering::SeqCst)
}

pub fn is_quota_full() -> bool {
    *QUOTA_FULL.lock().unwrap()
}

pub fn get_session_token() -> Option<String> {
    SESSION_TOKEN.lock().unwrap().clone()
}

pub fn check_quota_debug() -> Result<serde_json::Value, String> {
    let token = match SESSION_TOKEN.lock().unwrap().clone() {
        Some(t) => t,
        None => return Ok(serde_json::json!({
            "quotaFull": false,
            "error": "SESSION_TOKEN is empty — 请先执行一键续杯或开启无感换号"
        }))
    };
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| format!("build client: {}", e))?;
    let resp = client
        .get("https://cursor.com/api/usage-summary")
        .header("Cookie", format!("WorkosCursorSessionToken={}", token))
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send()
        .map_err(|e| format!("send request: {}", e))?;
    let status = resp.status().as_u16();
    let body = resp.text().map_err(|e| format!("read body: {}", e))?;

    // Parse response and update QUOTA_FULL
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&body) {
        let gpt4_total = json["gpt4"]["numRequestsTotal"].as_u64().unwrap_or(0);
        let gpt4_max = json["gpt4"]["maxRequestUsage"].as_u64().unwrap_or(u64::MAX);
        
        // New API structure: individualUsage.plan.autoPercentUsed / apiPercentUsed
        let api_pct = json["individualUsage"]["plan"]["apiPercentUsed"]
            .as_f64()
            .unwrap_or(0.0);
        let auto_pct = json["individualUsage"]["plan"]["autoPercentUsed"]
            .as_f64()
            .unwrap_or(0.0);
        
        let is_full = gpt4_total >= gpt4_max || api_pct >= 100.0 || auto_pct >= 100.0;
        let mut qf = QUOTA_FULL.lock().unwrap();
        *qf = is_full;

        Ok(serde_json::json!({
            "request": {
                "url": "https://cursor.com/api/usage-summary",
                "method": "GET",
                "headers": {
                    "Cookie": format!("WorkosCursorSessionToken={}", token),
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            },
            "response": {
                "status": status,
                "body": body,
                "parsed": {
                    "gpt4_total": gpt4_total,
                    "gpt4_max": gpt4_max,
                    "apiPercentUsed": api_pct,
                    "autoPercentUsed": auto_pct,
                    "quotaFull": is_full
                }
            }
        }))
    } else {
        Ok(serde_json::json!({
            "request": {
                "url": "https://cursor.com/api/usage-summary",
                "method": "GET",
                "headers": {
                    "Cookie": format!("WorkosCursorSessionToken={}", token),
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            },
            "response": {
                "status": status,
                "body": body,
                "parsed": null
            }
        }))
    }
}

pub fn push_switch(token: String, refresh_token: String, email: String) {
    push_switch_with_session(token, refresh_token, email, None);
}

pub fn push_switch_with_session(token: String, refresh_token: String, email: String, session_token: Option<String>) {
    let mut state = SWITCH.lock().unwrap();
    state.token = Some(token.clone());
    state.refresh_token = Some(refresh_token);
    state.email = Some(email);
    *ACCESS_TOKEN.lock().unwrap() = Some(token);
    if let Some(s) = session_token {
        *SESSION_TOKEN.lock().unwrap() = Some(s);
    }
}
