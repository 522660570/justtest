use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use base64::Engine;
use sha2::{Digest, Sha256};

pub const MAIN_PATCH_MARKER: &str = "/* __CURSOR_XUBEI_MAIN_INJECT__ */";
pub const MODEL_UNLOCK_MARKER: &str = "/*MOCURSO_MODELUNLOCK*/";
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
    r#"/* __CURSOR_XUBEI_MAIN_INJECT__ */
/* MOCURSO_UTIL_PATCH_START */
const _muM = await import('node:module');
const _muR = _muM.createRequire(import.meta.url);
const _muOS = _muR('os');
const _muFS = _muR('fs');
const _muH2 = _muR('http2');
const _muHOME = _muOS.homedir() || '';
const _muTF = _muHOME + '/.cursor-tk/active_token';
const _muOF = _muHOME + '/.cursor-tk/machine_id_override';
const _muQF = _muHOME + '/.cursor-tk/quota_exhausted';
const _muTUF = _muHOME + '/.cursor-tk/tok_used';
const _muRF = _muHOME + '/.cursor-tk/force_reconnect';
let _muRM = 0;
try {
  _muRM = _muFS.statSync(_muRF).mtimeMs;
} catch (e) {}
let _muTk = null,
  _muTt = 0;
let _muQL = 0;
const _muZ = _muR('zlib');
const _muNF = _muHOME + '/.cursor-tk/turn_active';
let _muTP = 0,
  _muTT = null,
  _muNA = 0,
  _muNT = 0;

function _muNW() {
  if (_muNA <= 0) return;
  const n = Date.now();
  if (n - _muNT < 2000) return;
  _muNT = n;
  try {
    _muFS.writeFileSync(_muNF, '1', 'utf8');
  } catch (e) {}
}

function _muGT() {
  const n = Date.now();
  if (n - _muTt > 500) {
    _muTt = n;
    try {
      _muTk = _muFS.readFileSync(_muTF, 'utf8').trim() || null;
    } catch (e) {
      _muTk = null;
    }
  }
  return _muTk;
}
let _muMap = null,
  _muMt = 0;

function _muGM() {
  const n = Date.now();
  if (n - _muMt > 500) {
    _muMt = n;
    try {
      const r = JSON.parse(_muFS.readFileSync(_muOF, 'utf8'));
      _muMap = Array.isArray(r && r.mappings) ? r.mappings.filter(m => m && typeof m.old === 'string' && typeof m.new === 'string' && m.old.length >= 8) : [];
    } catch (e) {
      _muMap = [];
    }
  }
  return _muMap || [];
}

function _muSR(s) {
  if (typeof s !== 'string') return s;
  const map = _muGM();
  if (!map.length) return s;
  let o = s;
  for (const m of map) {
    if (o.indexOf(m.old) !== -1) o = o.split(m.old).join(m.new);
  }
  return o;
}

function _muPH(h) {
  if (!h || typeof h !== 'object') return;
  try {
    for (const k of Object.keys(h)) {
      const v = h[k];
      if (typeof v === 'string') {
        const nv = _muSR(v);
        if (nv !== v) h[k] = nv;
      } else if (Array.isArray(v)) {
        h[k] = v.map(x => typeof x === 'string' ? _muSR(x) : x);
      }
    }
  } catch (e) {}
}

function _muBR(buf) {
  const map = _muGM();
  if (!buf || buf.length < 8 || !map.length) return buf;
  let out = buf,
    n = 0;
  for (const m of map) {
    if (m.old.length !== m.new.length) continue;
    const ob = Buffer.from(m.old, 'utf8'),
      nb = Buffer.from(m.new, 'utf8');
    if (ob.length !== nb.length) continue;
    let i = 0,
      w = null;
    while (true) {
      const f = out.indexOf(ob, i);
      if (f === -1) break;
      if (w === null) w = Buffer.from(out);
      nb.copy(w, f);
      i = f + ob.length;
      n++;
    }
    if (w !== null) out = w;
  }
  return out;
}

function _muPB(b) {
  if (b == null) return b;
  try {
    if (typeof b === 'string') {
      return _muSR(b);
    }
    if (Buffer.isBuffer(b)) return _muBR(b);
    if (b instanceof Uint8Array) return _muBR(Buffer.from(b.buffer, b.byteOffset, b.byteLength));
  } catch (e) {}
  return b;
}

function _muQW() {
  const n = Date.now();
  if (n - _muQL < 5000) return;
  _muQL = n;
  try {
    _muFS.writeFileSync(_muQF, String(n), 'utf8');
  } catch (e) {}
}

function _muEQ(s) {
  s = String(s || '').toLowerCase();
  return s.indexOf('resource_exhausted') !== -1 || s.indexOf('usage_limit') !== -1 || s.indexOf('usage limit') !== -1 || s.indexOf('usage%20limit') !== -1;
}

function _muWT(oldTk) {
  return new Promise(r => {
    let c = 0;
    const iv = setInterval(() => {
      c++;
      const t = _muGT();
      if (t && t !== oldTk) {
        clearInterval(iv);
        r(t);
      } else if (c > 60) {
        clearInterval(iv);
        r(null);
      } else {
        _muTt = 0;
      }
    }, 500);
    if (iv && iv.unref) iv.unref();
  });
}

const _muAG = new Set();
const _muHT = 18000;
const _muAF = _muQF.replace('quota_exhausted', 'auto_switch_on');
let _muAV = false,
  _muAT = 0;

function _muAS() {
  const n = Date.now();
  if (n - _muAT > 1000) {
    _muAT = n;
    try {
      _muAV = (n - _muFS.statSync(_muAF).mtimeMs) < 20000;
    } catch (e) {
      _muAV = false;
    }
  }
  return _muAV;
}

function _muTO() {
  const j = Buffer.from(JSON.stringify({
    error: {
      code: 'deadline_exceeded',
      message: 'deadline exceeded',
      details: [{
        type: 'aiserver.v1.ErrorDetails',
        value: Buffer.from([8, 25]).toString('base64')
      }]
    }
  }), 'utf8');
  const hd = Buffer.alloc(5);
  hd[0] = 2;
  hd.writeUInt32BE(j.length, 1);
  return Buffer.concat([hd, j]);
}

function _muKS() {
  try {
    let m = 0;
    try {
      m = _muFS.statSync(_muRF).mtimeMs;
    } catch (e) {
      return;
    }
    if (m > _muRM) {
      _muRM = m;
      _muTt = 0;
      const nt = _muGT();
      if (nt) {
        for (const f of Array.from(_muAG)) {
          try {
            f(nt);
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
}
try {
  const _muIv = setInterval(() => {
    _muKS();
    _muNW();
  }, 500);
  if (_muIv && _muIv.unref) _muIv.unref();
} catch (e) {}

function _muAuthority(sess) {
  try {
    for (const s of Object.getOwnPropertySymbols(sess)) {
      if (s.toString() === 'Symbol(authority)') return String(sess[s] || '');
    }
  } catch (e) {}
  return '';
}
try {
  let _muProto = null;
  try {
    const _t = _muH2.connect('http://127.0.0.1:1');
    _t.on('error', () => {});
    _muProto = Object.getPrototypeOf(_t);
    try {
      _t.destroy();
    } catch (e) {}
  } catch (e) {}
  if (_muProto && typeof _muProto.request === 'function' && !_muProto.__muPatched) {
    _muProto.__muPatched = true;
    const _origReq = _muProto.request;
    _muProto.request = function(headers, ...rest) {
      try {
        const auth = _muAuthority(this);
        const hAuth = headers && (headers[':authority'] || headers['host'] || '');
        const isCursor = (auth && (auth.includes('cursor.sh') || auth.includes('cursor.com'))) || (hAuth && (String(hAuth).includes('cursor.sh') || String(hAuth).includes('cursor.com')));
        if (isCursor && headers && typeof headers === 'object') {
          const t = _muGT();
          if (t) headers['authorization'] = 'Bearer ' + t;
          _muPH(headers);
          const _p = headers[':path'] || '';
          const _rs = _origReq.call(this, headers, ...rest);
          try {
            const _ow = _rs.write ? _rs.write.bind(_rs) : null;
            if (_ow) _rs.write = function(c, ...rr) {
              return _ow(_muPB(c), ...rr);
            };
            const _oe = _rs.end ? _rs.end.bind(_rs) : null;
            if (_oe) _rs.end = function(c, ...rr) {
              if (c == null) return _oe(...rr);
              return _oe(_muPB(c), ...rr);
            };
          } catch (e) {}
          try {
            _rs.on('response', (hd) => {
              try {
                if (hd && String(hd['grpc-status']) === '8') _muQW();
              } catch (e) {}
            });
            _rs.on('trailers', (tr) => {
              try {
                if (tr && (String(tr['grpc-status']) === '8' || _muEQ(tr['grpc-message']))) _muQW();
              } catch (e) {}
            });
          } catch (e) {}
          return _rs;
        }
      } catch (e) {}
      return _origReq.call(this, headers, ...rest);
    };
  }
} catch (e) {}
try {
  const _muHttp = _muR('http');
  const _muOM = _muHttp.OutgoingMessage;
  const _muCR = _muHttp.ClientRequest;
  const _muIsCur = function(rq) {
    try {
      if (!rq) return false;
      const cands = [rq.host, rq.getHeader && rq.getHeader('host'), rq.getHeader && rq.getHeader(':authority'), rq.path];
      for (const c of cands) {
        if (c && (String(c).includes('cursor.sh') || String(c).includes('cursor.com'))) return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };
  if (_muOM && _muOM.prototype && !_muOM.prototype.__muH1P) {
    _muOM.prototype.__muH1P = true;
    const _oSet = _muOM.prototype.setHeader;
    _muOM.prototype.setHeader = function(name, value) {
      try {
        if (_muIsCur(this) && typeof name === 'string') {
          const ln = name.toLowerCase();
          if (ln === 'authorization') {
            const t = _muGT();
            if (t) {
              value = 'Bearer ' + t;
            }
          } else if (typeof value === 'string') {
            const nv = _muSR(value);
            if (nv !== value) value = nv;
          }
        }
      } catch (e) {}
      return _oSet.call(this, name, value);
    };
  }
  if (_muCR && _muCR.prototype && !_muCR.prototype.__muH1BP) {
    _muCR.prototype.__muH1BP = true;
    const _oW = _muCR.prototype.write;
    const _oE = _muCR.prototype.end;
    _muCR.prototype.write = function(chunk, ...rest) {
      try {
        if (_muIsCur(this) && chunk != null) chunk = _muPB(chunk);
      } catch (e) {}
      return _oW.call(this, chunk, ...rest);
    };
    _muCR.prototype.end = function(chunk, ...rest) {
      try {
        if (_muIsCur(this) && chunk != null && typeof chunk !== 'function') chunk = _muPB(chunk);
      } catch (e) {}
      return _oE.call(this, chunk, ...rest);
    };
  }
} catch (e) {}
/* MOCURSO_UTIL_PATCH_END */
"#
}

/// 解锁 Auto 模型与会员权限，并更新 product.json 绕过文件完整性校验
/// 同时处理 desktop 和 glass 两种 workbench 文件
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

    // 4. 解锁 Auto 模型与更新 checksum（workbench 静态补丁）
    let _ = apply_model_unlock_and_checksum();

    // 5. 写入 machine_id_override 实现动态网络层 membership 替换
    //    注入脚本读取此文件，将 API 响应中的 "free" 实时替换为等长的 "pro "
    //    这是参考程序实现 Pro 持久解锁的核心机制
    let tk_dir = get_cursor_tk_dir()?;
    let override_file = tk_dir.join("machine_id_override");
    let override_json = r#"{"mappings":[{"old":"\"free\"","new":"\"pro \""}]}"#;
    let _ = fs::write(&override_file, override_json);

    // 6. 创建并激活 ~/.cursor-tk/auto_switch_on 标记
    let tk_dir = get_cursor_tk_dir()?;
    let auto_switch_file = tk_dir.join("auto_switch_on");
    let now_str = chrono::Utc::now().timestamp_millis().to_string();
    fs::write(&auto_switch_file, now_str)
        .map_err(|e| format!("激活无感换号标记文件失败: {}", e))?;

    // 如果传入了 token，同步写入 active_token
    if let Some(tk) = active_token {
        if !tk.trim().is_empty() {
            let _ = sync_active_token(tk);
        }
    }

    // 6. 启动保活心跳
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
        // 删除动态替换映射文件，恢复真实 membership 响应
        let override_file = tk_dir.join("machine_id_override");
        if override_file.exists() {
            let _ = fs::remove_file(override_file);
        }
    }

    // 2. 还原 main.js
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

    // 3. 还原 product.json
    if let Ok(prod_path) = find_product_json_path() {
        let prod_backup = prod_path.with_extension(PRODUCT_BACKUP_SUFFIX);
        if prod_backup.exists() {
            if let Ok(backup_content) = fs::read_to_string(&prod_backup) {
                let _ = fs::write(&prod_path, backup_content);
                let _ = fs::remove_file(prod_backup);
            }
        }
    }

    // 4. 还原 workbench 文件（desktop 和 glass 都剥离补丁）
    if let Ok(workbench_path) = super::workbench::find_workbench_path() {
        let glass_path = workbench_path.with_file_name("workbench.glass.main.js");
        for path in [&workbench_path, &glass_path] {
            if let Ok(content) = fs::read_to_string(path) {
                if content.contains(MODEL_UNLOCK_MARKER) || content.contains("/*MOCURSO_LABEL*/") || content.contains("/*MOCURSO_FORCE_PRO*/") {
                    let cleaned = content
                        .replace("/*MOCURSO_MODELUNLOCK*/o='pro';", "")
                        .replace("/*MOCURSO_MODELUNLOCK*/$1='pro';", "")
                        .replace("/*MOCURSO_LABEL*/\"Pro Plan\"", "\"Free Plan\"");
                    let re_restore = regex::Regex::new(r"(storeMembershipType\()/\*MOCURSO_FORCE_PRO\*/([A-Za-z_$][\w$]*)\.PRO(\))").ok();
                    let final_cleaned = if let Some(re) = re_restore {
                        re.replace_all(&cleaned, "${1}${2}.FREE${3}").to_string()
                    } else {
                        cleaned
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
    let path_res = find_main_js_path();
    let main_path = path_res.as_ref().ok().map(|p| p.to_string_lossy().to_string());
    let has_backup = path_res.as_ref().ok().map(|p| p.with_extension(MAIN_BACKUP_SUFFIX).exists()).unwrap_or(false);
    let is_patched = is_main_process_injected().unwrap_or(false);
    PatchStatus {
        is_patched,
        main_path,
        has_backup,
    }
}

/// 同步当前有效的 Access Token 到本地通信文件 (~/.cursor-tk/active_token)
pub fn sync_active_token(token: &str) -> Result<(), String> {
    let tk_dir = get_cursor_tk_dir()?;
    let token_file = tk_dir.join("active_token");
    fs::write(&token_file, token.trim())
        .map_err(|e| format!("写入 active_token 失败: {}", e))?;

    // 触碰 force_reconnect 文件通知拦截层刷新
    let reconnect_file = tk_dir.join("force_reconnect");
    let _ = fs::write(&reconnect_file, chrono::Utc::now().timestamp_millis().to_string());

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
