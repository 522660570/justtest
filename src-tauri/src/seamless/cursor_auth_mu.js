/* __CURSOR_XUBEI_MAIN_INJECT__ */
const _muM = await import('node:module');
const _muR = _muM.createRequire(import.meta.url);
const _muOS = _muR('os');
const _muFS = _muR('fs');
const _muH2 = _muR('http2');
const _muHOME = _muOS.homedir() || '';
const _muTF = _muHOME + '/.cursor-tk/active_token';
const _muOF = _muHOME + '/.cursor-tk/machine_id_override';
const _muQF = _muHOME + '/.cursor-tk/quota_exhausted';
// 调试探针：脚本启动时写入 inject_ok 文件（确认脚本已注入并运行）
try { _muFS.writeFileSync(_muHOME + '/.cursor-tk/inject_ok', String(Date.now()), 'utf8'); } catch(e) {}
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
      const raw = _muFS.readFileSync(_muTF, 'utf8').trim();
      // 只接受明文 JWT（不能是 cursor-safe-storage 加密格式，长度至少 20）
      if (raw && raw.length > 20 && !raw.startsWith('cursor-safe-storage:')) {
        _muTk = raw;
      } else {
        _muTk = null;
      }
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

function _muTX() {
  _muTT = null;
  if (!(_muTP > 0)) return;
  const d = _muTP;
  _muTP = 0;
  try {
    let v = 0;
    try {
      v = parseFloat(_muFS.readFileSync(_muTUF, 'utf8')) || 0;
    } catch (e) {}
    _muFS.writeFileSync(_muTUF, String(Math.round(v + d)), 'utf8');
  } catch (e) {}
}

function _muTA(d) {
  if (!(d > 0)) return;
  _muTP += d;
  if (!_muTT) {
    _muTT = setTimeout(_muTX, 800);
    if (_muTT && _muTT.unref) _muTT.unref();
  }
}

function _muVR(b, p) {
  let v = 0,
    s = 0;
  while (p.i < b.length) {
    const x = b[p.i++];
    v += (x & 0x7f) * Math.pow(2, s);
    s += 7;
    if (!(x & 0x80)) break;
  }
  return v;
}

function _muPF(b, cb) {
  const p = {
    i: 0
  };
  while (p.i < b.length) {
    const tg = _muVR(b, p);
    const fn = Math.floor(tg / 8),
      wt = tg & 7;
    if (wt === 0) {
      if (cb(fn, 0, _muVR(b, p)) === false) return;
    } else if (wt === 2) {
      const l = _muVR(b, p);
      const s = b.subarray(p.i, p.i + l);
      p.i += l;
      if (cb(fn, 2, s) === false) return;
    } else if (wt === 5) p.i += 4;
    else if (wt === 1) p.i += 8;
    else return;
  }
}

function _muLV(st) {
  const t = st.o * 5;
  if (t > st.a) {
    _muTA(t - st.a);
    st.a = t;
  }
}

function _muTK(body, st) {
  try {
    if (!body || body.length < 2) return;
    let iu = null;
    _muPF(body, (f, w, v) => {
      if (f === 1 && w === 2) {
        iu = v;
        return false;
      }
    });
    if (!iu) return;
    _muPF(iu, (f, w, v) => {
      if (w !== 2) return;
      if (f === 14) {
        const t = {};
        _muPF(v, (a, b2, c) => {
          if (b2 === 0) t[a] = c;
        });
        const c = (t[1] || 0) + (t[2] || 0) * 5 + (t[4] || 0) * 1.25 + (t[3] || 0) * 0.1 + (t[5] || 0) * 5;
        if (c > st.a) _muTA(c - st.a);
        st.o = 0;
        st.a = 0;
        return false;
      }
      if (f === 8) {
        let k = 0;
        _muPF(v, (a, b2, c) => {
          if (a === 1 && b2 === 0) k = c;
        });
        if (k > 0) {
          st.o += k;
          _muLV(st);
        }
        return false;
      }
    });
  } catch (e) {}
}

function _muGZ(b) {
  try {
    return _muZ.gunzipSync(b);
  } catch (e) {}
  try {
    return _muZ.brotliDecompressSync(b);
  } catch (e) {}
  return null;
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

function _muEQ(s) {
  s = String(s || '').toLowerCase();
  return s.indexOf('resource_exhausted') !== -1 || s.indexOf('usage_limit') !== -1 || s.indexOf('usage limit') !== -1 || s.indexOf('usage%20limit') !== -1;
}

function _muDE(b) {
  try {
    let i = 0;
    while (i < b.length) {
      const tg = b[i++];
      const fn = tg >>> 3,
        wt = tg & 7;
      if (wt === 0) {
        let v = 0,
          sh = 0;
        while (i < b.length) {
          const x = b[i++];
          v |= (x & 0x7f) << sh;
          sh += 7;
          if (!(x & 0x80)) break;
        }
        if (fn === 1) return v === 9 || v === 10 || v === 41;
      } else if (wt === 2) {
        let l = 0,
          sh = 0;
        while (i < b.length) {
          const x = b[i++];
          l |= (x & 0x7f) << sh;
          sh += 7;
          if (!(x & 0x80)) break;
        }
        i += l;
      } else if (wt === 5) {
        i += 4;
      } else if (wt === 1) {
        i += 8;
      } else {
        return false;
      }
    }
  } catch (e) {}
  return false;
}

function _muJE(j) {
  try {
    if (!j || typeof j !== 'object') return false;
    if (j.connectCode === 8 || j.errorCode === 51) return true;
    const s = JSON.stringify(j).toLowerCase();
    if (s.indexOf('resource_exhausted') !== -1 || s.indexOf('usage limit') !== -1 || s.indexOf('usage_limit') !== -1 || s.indexOf('limit_hit') !== -1 || s.indexOf('rate_limited') !== -1) return true;
  } catch(e) {}
  try {
    const er = j && (j.error || j);
    if (!er || typeof er !== 'object') return false;
    if (String(er.code || '').toLowerCase() === 'resource_exhausted') return true;
    if (er.code && _muEQ(er.message)) return true;
    if (Array.isArray(er.details)) {
      for (const d of er.details) {
        if (d && String(d.type || '').indexOf('ErrorDetails') !== -1 && typeof d.value === 'string' && _muDE(Buffer.from(d.value, 'base64'))) return true;
      }
    }
  } catch (e) {}
  return false;
}

function _muIsQ(buf) {
  try {
    if (!Buffer.isBuffer(buf) || buf.length < 2) return false;
    if (buf[0] === 0x7b) {
      try {
        return _muJE(JSON.parse(buf.toString('utf8')));
      } catch (e) {
        return false;
      }
    }
    let off = 0;
    while (off + 5 <= buf.length) {
      const fl = buf[off];
      const len = buf.readUInt32BE(off + 1);
      if (off + 5 + len > buf.length) break;
      const body = buf.slice(off + 5, off + 5 + len);
      if (fl & 0x80) {
        const tr = body.toString('utf8').toLowerCase();
        if (tr.indexOf('grpc-status: 8') !== -1 || tr.indexOf('grpc-status:8') !== -1 || _muEQ(tr)) return true;
      } else if (fl & 0x02) {
        try {
          const bd = (fl & 0x01) ? _muGZ(body) : body;
          if (bd && _muJE(JSON.parse(bd.toString('utf8')))) return true;
        } catch (e) {}
      }
      off += 5 + len;
    }
  } catch (e) {}
  return false;
}

function _muSG(buf) {
  try {
    if (!Buffer.isBuffer(buf) || buf.length < 2) return false;
    let msg = buf;
    if (buf[0] === 0 && buf.length >= 5) {
      const len = buf.readUInt32BE(1);
      if (5 + len <= buf.length) msg = buf.slice(5, 5 + len);
    }
    let i = 0;
    while (i < msg.length) {
      const tg = msg[i++];
      const fn = tg >>> 3,
        wt = tg & 7;
      if (wt === 0) {
        let v = 0,
          sh = 0;
        while (i < msg.length) {
          const x = msg[i++];
          v |= (x & 0x7f) << sh;
          sh += 7;
          if (!(x & 0x80)) break;
        }
        if (fn === 12) return v >= 1;
      } else if (wt === 2) {
        let l = 0,
          sh = 0;
        while (i < msg.length) {
          const x = msg[i++];
          l |= (x & 0x7f) << sh;
          sh += 7;
          if (!(x & 0x80)) break;
        }
        i += l;
      } else if (wt === 5) {
        i += 4;
      } else if (wt === 1) {
        i += 8;
      } else {
        return false;
      }
    }
  } catch (e) {}
  return false;
}

function _muCG(buf, path) {
  try {
    if (_muIsQ(buf)) {
      _muQW();
      return;
    }
    if (typeof path === 'string' && path.indexOf('UsageLimitStatus') !== -1) {
      if (_muSG(buf)) {
        _muQW();
        return;
      }
      let msg = buf;
      if (buf[0] === 0 && buf.length >= 5) {
        const len = buf.readUInt32BE(1);
        if (5 + len <= buf.length) msg = buf.slice(5, 5 + len);
      }
      let ii = 0;
      while (ii < msg.length) {
        const tg = msg[ii++];
        const fn = tg >>> 3,
          wt = tg & 7;
        if (wt === 2) {
          let l = 0,
            sh = 0;
          while (ii < msg.length) {
            const x = msg[ii++];
            l |= (x & 0x7f) << sh;
            sh += 7;
            if (!(x & 0x80)) break;
          }
          if (fn === 1 && ii + l <= msg.length && _muSG(msg.slice(ii, ii + l))) {
            _muQW();
            return;
          }
          ii += l;
        } else if (wt === 0) {
          let v = 0,
            sh = 0;
          while (ii < msg.length) {
            const x = msg[ii++];
            v |= (x & 0x7f) << sh;
            sh += 7;
            if (!(x & 0x80)) break;
          }
        } else if (wt === 5) {
          ii += 4;
        } else if (wt === 1) {
          ii += 8;
        } else break;
      }
    }
  } catch (e) {}
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

function _muAH(rs, tk, trn) {
  const P = rs.push;
  const ts = {
    o: 0,
    a: 0
  };
  let act = 0,
    conn = false,
    want = false,
    done = false,
    sealed = false,
    acc = null,
    held = null,
    heldEof = false,
    ht = null;
  const fin = () => {
    if (act === 1) {
      act = 2;
      _muNA = Math.max(0, _muNA - 1);
    }
    done = true;
    _muAG.delete(seal);
    if (ht) {
      clearTimeout(ht);
      ht = null;
    }
  };
  const cl = () => {
    try {
      if (!rs.closed && !rs.destroyed) rs.close(_muH2.constants.NGHTTP2_CANCEL);
    } catch (e) {}
  };
  const inject = () => {
    const st = rs._readableState;
    if (rs.destroyed || (st && st.ended)) {
      fin();
      return;
    }
    sealed = true;
    held = null;
    acc = null;
    fin();
    P.call(rs, _muTO());
    P.call(rs, null);
    rs.once('end', () => {
      const x = setTimeout(cl, 100);
      if (x && x.unref) x.unref();
    });
    const y = setTimeout(cl, 10000);
    if (y && y.unref) y.unref();
  };
  const seal = (nt) => {
    if (done || sealed || (nt && nt === tk)) return;
    if (!conn) {
      want = true;
      return;
    }
    inject();
  };
  const release = () => {
    ht = null;
    if (sealed || !held) return;
    const hv = held;
    held = null;
    fin();
    P.call(rs, hv);
    if (heldEof) P.call(rs, null);
  };
  _muAG.add(seal);
  const E = rs.emit;
  rs.emit = function(ev, ...a) {
    if (ev === 'aborted' && (sealed || held !== null)) return false;
    return E.call(rs, ev, ...a);
  };
  rs.once('response', (hd) => {
    try {
      conn = String((hd && hd['content-type']) || '').indexOf('application/connect') === 0;
      if (!conn) {
        fin();
        return;
      }
      if (trn && !act && !done) {
        act = 1;
        _muNA++;
        _muNT = 0;
        _muNW();
      }
      if (want) inject();
    } catch (e) {}
  });
  rs.once('close', fin);
  rs.push = function(ch, enc) {
    try {
      if (sealed) return true;
      if (!conn) return P.call(rs, ch, enc);
      if (ch === null) {
        if (held) {
          heldEof = true;
          return false;
        }
        if (acc) {
          const a = acc;
          acc = null;
          P.call(rs, a);
        }
        fin();
        return P.call(rs, null);
      }
      if (held) return true;
      const ck = Buffer.isBuffer(ch) ? ch : Buffer.from(ch, enc);
      acc = acc ? Buffer.concat([acc, ck]) : ck;
      let o = 0,
        r = true;
      const out = [];
      while (acc.length - o >= 5) {
        const fl = acc[o],
          ln = acc.readUInt32BE(o + 1);
        if (acc.length - o - 5 < ln) break;
        const env = acc.subarray(o, o + 5 + ln);
        o += 5 + ln;
        if (fl & 2) {
          if (_muIsQ(env)) {
            _muQW();
            if (!done && _muAS()) {
              held = env;
              break;
            }
          }
        } else if (!(fl & 1)) {
          _muTK(env.subarray(5), ts);
        }
        out.push(env);
      }
      acc = (held || o >= acc.length) ? null : acc.subarray(o);
      for (const e of out) r = P.call(rs, e);
      if (held && !ht) {
        ht = setTimeout(release, _muHT);
        if (ht && ht.unref) ht.unref();
      }
      return r;
    } catch (e) {
      return P.call(rs, ch, enc);
    }
  };
  return {
    q: () => sealed || held !== null
  };
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
        // 诊断：记录所有被拦截的请求路径
        try {
          const _p2 = headers && (headers[':path'] || '');
          if (_p2) _muFS.appendFileSync(_muHOME + '/.cursor-tk/req_log.txt', String(Date.now()) + ' ' + (auth||hAuth) + ' ' + _p2 + '\n', 'utf8');
        } catch(e) {}
        if (isCursor && headers && typeof headers === 'object') {
          const t = _muGT();
          if (t) headers['authorization'] = 'Bearer ' + t;
          _muPH(headers);
          const _p = headers[':path'] || '';
          const _sess = this;
          const _isAg = _p.includes('/agent.v1.AgentService/') || 
                        _p.includes('/StreamUnifiedChatWithTools') || 
                        _p.includes('InferenceService') || 
                        _p.includes('RunInference') ||
                        _p.includes('/aiserver.v1.Chat') ||
                        _p.includes('/aiserver.v1.Composer');
          let _ag = null;
          const _reqBody = [];
          const _rs = _origReq.call(this, headers, ...rest);
          try {
            const _ow = _rs.write ? _rs.write.bind(_rs) : null;
            if (_ow) _rs.write = function(c, ...rr) {
              if (_ag && _ag.q()) {
                const cb = rr[rr.length - 1];
                if (typeof cb === 'function') process.nextTick(cb);
                return true;
              }
              try {
                if (!_isAg && c != null) _reqBody.push(Buffer.isBuffer(c) ? Buffer.from(c) : Buffer.from(c));
              } catch (e) {}
              return _ow(_muPB(c), ...rr);
            };
            const _oe = _rs.end ? _rs.end.bind(_rs) : null;
            if (_oe) _rs.end = function(c, ...rr) {
              try {
                if (!_isAg && c != null && typeof c !== 'function') _reqBody.push(Buffer.isBuffer(c) ? Buffer.from(c) : Buffer.from(c));
              } catch (e) {}
              if (c == null) return _oe(...rr);
              return _oe(_muPB(c), ...rr);
            };
          } catch (e) {}
          try {
            _rs.on('response', (hd) => {
              try {
                // 调试：记录 main.js 拦截到的响应
                try {
                  const _dbgP = (_muHOME + '/.cursor-tk/mu_resp_log.txt');
                  const _line = '[resp] path=' + _p + ' status=' + (hd && hd[':status']) + ' grpc=' + (hd && hd['grpc-status']) + ' ct=' + (hd && hd['content-type']) + '\n';
                  _muFS.appendFileSync(_dbgP, _line, 'utf8');
                } catch(e) {}
                if (hd) {
                  const st = String(hd[':status'] || '');
                  if (st === '429' || st === '403') _muQW();
                  if (String(hd['grpc-status']) === '8') _muQW();
                }
              } catch (e) {}
            });
            _rs.on('trailers', (tr) => {
              try {
                // 调试：记录 trailers
                try {
                  const _dbgP = (_muHOME + '/.cursor-tk/mu_resp_log.txt');
                  const _line = '[trailer] path=' + _p + ' grpc=' + (tr && tr['grpc-status']) + ' msg=' + (tr && tr['grpc-message']) + '\n';
                  _muFS.appendFileSync(_dbgP, _line, 'utf8');
                } catch(e) {}
                if (tr && (String(tr['grpc-status']) === '8' || _muEQ(tr['grpc-message']))) _muQW();
              } catch (e) {}
            });
          } catch (e) {}
          if (_isAg) {
            try {
              _ag = _muAH(_rs, t, _p.includes('/agent.v1.AgentService/Run') || _p.includes('/StreamUnifiedChatWithTools') || _p.includes('Inference') || _p.includes('Chat') || _p.includes('Composer'));
            } catch (e) {}
          } else if (_p.includes('/aiserver.v1.Ai')) {
            const _origEmit = _rs.emit.bind(_rs);
            let _fb2 = null;
            let _buf2 = [];
            let _decided2 = false;
            let _retrying2 = false;
            let _acc2 = null;
            const _scan2 = (ck) => {
              try {
                _acc2 = _acc2 ? Buffer.concat([_acc2, ck]) : ck;
                let o = 0;
                while (_acc2.length - o >= 5) {
                  const fl = _acc2[o];
                  const ln = _acc2.readUInt32BE(o + 1);
                  if (_acc2.length - o - 5 < ln) break;
                  if ((fl & 0x82) !== 0) {
                    const fr = _acc2.slice(o, o + 5 + ln);
                    if (_muIsQ(fr)) _muQW();
                  }
                  o += 5 + ln;
                }
                _acc2 = o > 0 ? (o < _acc2.length ? _acc2.slice(o) : null) : _acc2;
              } catch (e) {}
            };
            _rs.emit = function(ev, ...args) {
              if (_retrying2) return false;
              if (ev === 'data') {
                const ch = args[0];
                const ck = Buffer.isBuffer(ch) ? ch : Buffer.from(ch);
                if (_decided2) {
                  _scan2(ck);
                  return _origEmit(ev, ...args);
                }
                try {
                  _buf2.push(ck);
                  if (_fb2 === null && ck.length > 0) _fb2 = ck[0];
                  if (_fb2 === null) return false;
                  if ((_fb2 & 0x82) === 0) {
                    _decided2 = true;
                    for (const bk of _buf2) {
                      _scan2(bk);
                      _origEmit('data', bk);
                    }
                    _buf2 = null;
                    return true;
                  }
                  return false;
                } catch (e) {
                  _decided2 = true;
                  if (_buf2) {
                    for (const bk of _buf2) _origEmit('data', bk);
                    _buf2 = null;
                  }
                  return _origEmit(ev, ...args);
                }
              }
              if (ev === 'end') {
                if (_retrying2) return false;
                if (!_decided2 && _buf2 && _buf2.length > 0) {
                  const cat = Buffer.concat(_buf2);
                  if (_muIsQ(cat)) {
                    _retrying2 = true;
                    _muQW();
                    (async () => {
                      try {
                        const oldTk = _muTk;
                        const newTk = await _muWT(oldTk);
                        if (!newTk) {
                          _retrying2 = false;
                          for (const bk of _buf2) _origEmit('data', bk);
                          _origEmit('end');
                          return;
                        }
                        const nh = Object.assign({}, headers);
                        nh['authorization'] = 'Bearer ' + newTk;
                        _muPH(nh);
                        const ns = _muH2.connect(auth || ('https://' + hAuth));
                        const nr = ns.request(nh);
                        try {
                          const body = Buffer.concat(_reqBody);
                          if (body.length > 0) nr.end(body);
                          else nr.end();
                        } catch (e) {
                          nr.end();
                        }
                        nr.on('data', (c) => _origEmit('data', c));
                        nr.on('end', () => {
                          _origEmit('end');
                          try {
                            ns.close();
                          } catch (e) {}
                        });
                        nr.on('error', (e) => {
                          _retrying2 = false;
                          _origEmit('error', e);
                        });
                      } catch (e) {
                        _retrying2 = false;
                        for (const bk of _buf2) _origEmit('data', bk);
                        _origEmit('end');
                      }
                    })();
                    return false;
                  }
                  for (const bk of _buf2) {
                    _scan2(bk);
                    _origEmit('data', bk);
                  }
                  _buf2 = null;
                  _decided2 = true;
                }
                return _origEmit(ev, ...args);
              }
              return _origEmit(ev, ...args);
            };
          } else {
            try {
              const _rcks2 = [];
              _rs.on('data', (ch) => {
                try {
                  _rcks2.push(Buffer.isBuffer(ch) ? ch : Buffer.from(ch));
                } catch (e) {}
              });
              _rs.on('end', () => {
                try {
                  if (_rcks2.length) _muCG(Buffer.concat(_rcks2), _p);
                } catch (e) {}
              });
            } catch (e) {}
          }
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

// ── Electron session.webRequest 钩子 ──
// AI 对话请求走 Chromium 网络层，需要通过 session.webRequest 拦截
try {
  const _muElec = _muR('electron');
  const _muApp = _muElec && _muElec.app;
  if (_muApp) {
    const _setupWebReq = () => {
      try {
        // 诊断：记录 setup 状态
        try {
          const _diag = 'isReady=' + _muApp.isReady() +
            ' hasSess=' + !!(_muElec.session) +
            ' hasDefault=' + !!(_muElec.session && _muElec.session.defaultSession) + '\n';
          _muFS.writeFileSync(_muHOME + '/.cursor-tk/mu_web_setup.txt', _diag, 'utf8');
        } catch(e) {}

        const _muSess = _muElec.session && _muElec.session.defaultSession;
        if (!_muSess) {
          _muFS.writeFileSync(_muHOME + '/.cursor-tk/mu_web_err.txt', 'no defaultSession', 'utf8');
          return;
        }

        // 临时用 <all_urls> 拦截所有请求，找出 AI 实际走的域名
        _muSess.webRequest.onCompleted({ urls: ['<all_urls>'] }, (details) => {
          try {
            const url = details.url || '';
            const statusCode = details.statusCode;
            const hdrs = details.responseHeaders || {};
            const grpcArr = hdrs['grpc-status'] || hdrs['Grpc-Status'] || [];
            const grpcStatus = grpcArr[0];
            // 记录所有非本地请求（找到 AI 请求的真实域名）
            if (!url.startsWith('devtools://') && !url.startsWith('chrome-extension://')) {
              try {
                const _logLine = '[web] ' + statusCode + ' grpc=' + grpcStatus +
                  ' ' + url.substring(0, 120) + '\n';
                _muFS.appendFileSync(_muHOME + '/.cursor-tk/mu_web_log.txt', _logLine, 'utf8');
              } catch (e) {}
            }
            // 检测额度耗尽
            if (statusCode === 429 || statusCode === 403 || grpcStatus === '8') {
              if (url.includes('cursor')) _muQW();
            }
          } catch (e) {}
        });
      } catch (e) {
        try { _muFS.writeFileSync(_muHOME + '/.cursor-tk/mu_web_err.txt', 'setup: ' + String(e), 'utf8'); } catch(e2) {}
      }
    };
    if (_muApp.isReady()) {
      _setupWebReq();
    } else {
      _muApp.whenReady().then(_setupWebReq).catch((e) => {
        try { _muFS.writeFileSync(_muHOME + '/.cursor-tk/mu_web_err.txt', 'whenReady: ' + String(e), 'utf8'); } catch(e2) {}
      });
    }
  } else {
    // electron.app 不存在，说明 main.js 不在 Electron 主进程中
    _muFS.writeFileSync(_muHOME + '/.cursor-tk/mu_web_err.txt', 'no electron.app, typeof electron=' + typeof _muElec, 'utf8');
  }
} catch (e) {
  try { _muFS.writeFileSync(_muHOME + '/.cursor-tk/mu_web_err.txt', 'outer: ' + String(e), 'utf8'); } catch(e2) {}
}