/* __CURSOR_XUBEI_MC_INJECT__ */
const _mcM = await import("node:module");
const _mcR = _mcM.createRequire(import.meta.url);
const _mcOS = _mcR("os");
const _mcF = _mcR("fs");
const _mcZ = _mcR("zlib");
const _mcHOME = _mcOS.homedir() || "";
const _mcTF = _mcHOME + "/.cursor-tk/active_token";
const _mcOF = _mcHOME + "/.cursor-tk/machine_id_override";
const _mcQF = _mcHOME + "/.cursor-tk/quota_exhausted";
const _mcRF = _mcHOME + "/.cursor-tk/force_reconnect";
try {
  _mcF.writeFileSync(_mcHOME + "/.cursor-tk/mc_inject_ok", String(Date.now()), "utf8");
} catch (e) {}
const _mcTUF = _mcQF.replace("quota_exhausted", "tok_used");
const _mcNF = _mcQF.replace("quota_exhausted", "turn_active");
let _mcTk = null,
  _mcLt = 0;
let _mcMap = null,
  _mcMlt = 0;
let _mcRM = 0;
let _mcQL = 0;
let _mcTP = 0,
  _mcTT = null,
  _mcNA = 0,
  _mcNT = 0;

function _mcNW() {
  if (_mcNA <= 0) return;
  const n = Date.now();
  if (n - _mcNT < 2000) return;
  _mcNT = n;
  try {
    _mcF.writeFileSync(_mcNF, "1", "utf8");
  } catch (e) {}
}
let _mcH2 = null,
  _mcOC = null;
try {
  _mcRM = _mcF.statSync(_mcRF).mtimeMs;
} catch (e) {}

function _mcKS() {
  try {
    let m = 0;
    try {
      m = _mcF.statSync(_mcRF).mtimeMs;
    } catch (e) {
      return;
    }
    if (m > _mcRM) {
      _mcRM = m;
      _mcLt = 0;
      const nt = _mcGT();
      if (nt) {
        for (const f of Array.from(_mcAG)) {
          try {
            f(nt);
          } catch (e) {}
        }
      }
    }
  } catch (e) {}
}
try {
  const _mcIv = setInterval(() => {
    _mcKS();
    _mcNW();
  }, 500);
  if (_mcIv && _mcIv.unref) _mcIv.unref();
} catch (e) {}

function _mcGT() {
  const n = Date.now();
  if (n - _mcLt > 500) {
    _mcLt = n;
    try {
      const raw = _mcF.readFileSync(_mcTF, "utf8").trim();
      if (raw && raw.length > 20 && !raw.startsWith("cursor-safe-storage:")) {
        _mcTk = raw;
      } else {
        _mcTk = null;
      }
    } catch (e) {
      _mcTk = null;
    }
  }
  return _mcTk;
}

function _mcGM() {
  const n = Date.now();
  if (n - _mcMlt > 500) {
    _mcMlt = n;
    try {
      const r = JSON.parse(_mcF.readFileSync(_mcOF, "utf8"));
      _mcMap = Array.isArray(r && r.mappings)
        ? r.mappings.filter(
            (m) =>
              m &&
              typeof m.old === "string" &&
              typeof m.new === "string" &&
              m.old.length >= 8
          )
        : [];
    } catch (e) {
      _mcMap = [];
    }
  }
  return _mcMap || [];
}

function _mcSR(s) {
  if (typeof s !== "string") return s;
  const map = _mcGM();
  if (!map.length) return s;
  let out = s;
  for (const m of map) {
    if (out.indexOf(m.old) !== -1) {
      out = out.split(m.old).join(m.new);
    }
  }
  return out;
}

function _mcPH(h) {
  if (!h || typeof h !== "object") return;
  try {
    for (const k of Object.keys(h)) {
      const v = h[k];
      if (typeof v === "string") {
        const nv = _mcSR(v);
        if (nv !== v) {
          h[k] = nv;
        }
      } else if (Array.isArray(v)) {
        const nva = v.map((x) => (typeof x === "string" ? _mcSR(x) : x));
        if (JSON.stringify(nva) !== JSON.stringify(v)) {
          h[k] = nva;
        }
      }
    }
  } catch (e) {}
}

function _mcBR(buf) {
  const map = _mcGM();
  if (!buf || buf.length < 8) return buf;
  let out = buf;
  if (map.length) {
    for (const m of map) {
      if (m.old.length !== m.new.length) continue;
      const oldB = Buffer.from(m.old, "utf8");
      const newB = Buffer.from(m.new, "utf8");
      if (oldB.length !== newB.length) continue;
      let idx = 0,
        localCount = 0,
        working = null;
      while (true) {
        const found = out.indexOf(oldB, idx);
        if (found === -1) break;
        if (working === null) working = Buffer.from(out);
        newB.copy(working, found);
        idx = found + oldB.length;
        localCount++;
      }
      if (localCount > 0) {
        out = working;
      }
    }
  }
  return out;
}

function _mcPB(b) {
  if (b == null) return b;
  try {
    if (typeof b === "string") {
      const t = b.trim();
      if (t.startsWith("{") || t.startsWith("[")) {
        try {
          const o = JSON.parse(b);
          return _mcSR(JSON.stringify(o));
        } catch (e) {}
      }
      return _mcSR(b);
    }
    if (Buffer.isBuffer(b)) {
      return _mcBR(b);
    }
    if (b instanceof Uint8Array) {
      return _mcBR(Buffer.from(b.buffer, b.byteOffset, b.byteLength));
    }
    if (
      b &&
      b.buffer instanceof ArrayBuffer &&
      typeof b.byteLength === "number"
    ) {
      return _mcBR(Buffer.from(b.buffer, b.byteOffset || 0, b.byteLength));
    }
  } catch (e) {}
  return b;
}

function _mcQW() {
  const n = Date.now();
  if (n - _mcQL < 5000) return;
  _mcQL = n;
  try {
    _mcF.writeFileSync(_mcQF, String(n), "utf8");
  } catch (e) {}
}

function _mcTX() {
  _mcTT = null;
  if (!(_mcTP > 0)) return;
  const d = _mcTP;
  _mcTP = 0;
  try {
    let v = 0;
    try {
      v = parseFloat(_mcF.readFileSync(_mcTUF, "utf8")) || 0;
    } catch (e) {}
    _mcF.writeFileSync(_mcTUF, String(Math.round(v + d)), "utf8");
  } catch (e) {}
}

function _mcTA(d) {
  if (!(d > 0)) return;
  _mcTP += d;
  if (!_mcTT) {
    _mcTT = setTimeout(_mcTX, 800);
    if (_mcTT && _mcTT.unref) _mcTT.unref();
  }
}

function _mcVR(b, p) {
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

function _mcPF(b, cb) {
  const p = {
    i: 0,
  };
  while (p.i < b.length) {
    const tg = _mcVR(b, p);
    const fn = Math.floor(tg / 8),
      wt = tg & 7;
    if (wt === 0) {
      if (cb(fn, 0, _mcVR(b, p)) === false) return;
    } else if (wt === 2) {
      const l = _mcVR(b, p);
      const s = b.subarray(p.i, p.i + l);
      p.i += l;
      if (cb(fn, 2, s) === false) return;
    } else if (wt === 5) p.i += 4;
    else if (wt === 1) p.i += 8;
    else return;
  }
}

function _mcLV(st) {
  const t = st.o * 5;
  if (t > st.a) {
    _mcTA(t - st.a);
    st.a = t;
  }
}

function _mcTK(body, st) {
  try {
    if (!body || body.length < 2) return;
    let iu = null;
    _mcPF(body, (f, w, v) => {
      if (f === 1 && w === 2) {
        iu = v;
        return false;
      }
    });
    if (!iu) return;
    _mcPF(iu, (f, w, v) => {
      if (w !== 2) return;
      if (f === 14) {
        const t = {};
        _mcPF(v, (a, b2, c) => {
          if (b2 === 0) t[a] = c;
        });
        const c =
          (t[1] || 0) +
          (t[2] || 0) * 5 +
          (t[4] || 0) * 1.25 +
          (t[3] || 0) * 0.1 +
          (t[5] || 0) * 5;
        if (c > st.a) _mcTA(c - st.a);
        st.o = 0;
        st.a = 0;
        return false;
      }
      if (f === 8) {
        let k = 0;
        _mcPF(v, (a, b2, c) => {
          if (a === 1 && b2 === 0) k = c;
        });
        if (k > 0) {
          st.o += k;
          _mcLV(st);
        }
        return false;
      }
    });
  } catch (e) {}
}

function _mcGZ(b) {
  try {
    return _mcZ.gunzipSync(b);
  } catch (e) {}
  try {
    return _mcZ.brotliDecompressSync(b);
  } catch (e) {}
  return null;
}

function _mcWT(oldTk) {
  return new Promise((r) => {
    let c = 0;
    const iv = setInterval(() => {
      c++;
      const t = _mcGT();
      if (t && t !== oldTk) {
        clearInterval(iv);
        r(t);
      } else if (c > 60) {
        clearInterval(iv);
        r(null);
      } else {
        _mcLt = 0;
      }
    }, 500);
    if (iv && iv.unref) iv.unref();
  });
}

function _mcEQ(s) {
  s = String(s || "").toLowerCase();
  return (
    s.indexOf("resource_exhausted") !== -1 ||
    s.indexOf("usage_limit") !== -1 ||
    s.indexOf("usage limit") !== -1 ||
    s.indexOf("usage%20limit") !== -1
  );
}

function _mcDE(b) {
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

function _mcJE(j) {
  try {
    if (!j || typeof j !== "object") return false;
    if (j.connectCode === 8 || j.errorCode === 51) return true;
    const s = JSON.stringify(j).toLowerCase();
    if (
      s.indexOf("resource_exhausted") !== -1 ||
      s.indexOf("usage limit") !== -1 ||
      s.indexOf("usage_limit") !== -1 ||
      s.indexOf("limit_hit") !== -1 ||
      s.indexOf("rate_limited") !== -1
    )
      return true;
  } catch (e) {}
  try {
    const er = j && (j.error || j);
    if (!er || typeof er !== "object") return false;
    if (String(er.code || "").toLowerCase() === "resource_exhausted")
      return true;
    if (er.code && _mcEQ(er.message)) return true;
    if (Array.isArray(er.details)) {
      for (const d of er.details) {
        if (
          d &&
          String(d.type || "").indexOf("ErrorDetails") !== -1 &&
          typeof d.value === "string" &&
          _mcDE(Buffer.from(d.value, "base64"))
        )
          return true;
      }
    }
  } catch (e) {}
  return false;
}

function _mcIsQ(buf) {
  try {
    if (!Buffer.isBuffer(buf) || buf.length < 2) return false;
    if (buf[0] === 0x7b) {
      try {
        return _mcJE(JSON.parse(buf.toString("utf8")));
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
        const tr = body.toString("utf8").toLowerCase();
        if (
          tr.indexOf("grpc-status: 8") !== -1 ||
          tr.indexOf("grpc-status:8") !== -1 ||
          _mcEQ(tr)
        )
          return true;
      } else if (fl & 0x02) {
        try {
          const bd = fl & 0x01 ? _mcGZ(body) : body;
          if (bd && _mcJE(JSON.parse(bd.toString("utf8")))) return true;
        } catch (e) {}
      }
      off += 5 + len;
    }
  } catch (e) {}
  return false;
}

function _mcSG(buf) {
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

function _mcCG(buf, path) {
  try {
    if (_mcIsQ(buf)) {
      _mcQW();
      return;
    }
    if (typeof path === "string" && path.indexOf("UsageLimitStatus") !== -1) {
      if (_mcSG(buf)) {
        _mcQW();
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
          if (
            fn === 1 &&
            ii + l <= msg.length &&
            _mcSG(msg.slice(ii, ii + l))
          ) {
            _mcQW();
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
const _mcAG = new Set();
const _mcHT = 18000;
const _mcAF = _mcQF.replace("quota_exhausted", "auto_switch_on");
let _mcAV = false,
  _mcAT = 0;

function _mcAS() {
  const n = Date.now();
  if (n - _mcAT > 1000) {
    _mcAT = n;
    try {
      _mcAV = n - _mcF.statSync(_mcAF).mtimeMs < 20000;
    } catch (e) {
      _mcAV = false;
    }
  }
  return _mcAV;
}

function _mcTO() {
  const j = Buffer.from(
    JSON.stringify({
      error: {
        code: "deadline_exceeded",
        message: "deadline exceeded",
        details: [
          {
            type: "aiserver.v1.ErrorDetails",
            value: Buffer.from([8, 25]).toString("base64"),
          },
        ],
      },
    }),
    "utf8"
  );
  const hd = Buffer.alloc(5);
  hd[0] = 2;
  hd.writeUInt32BE(j.length, 1);
  return Buffer.concat([hd, j]);
}

function _mcAH(rs, tk, trn) {
  const P = rs.push;
  const ts = {
    o: 0,
    a: 0,
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
      _mcNA = Math.max(0, _mcNA - 1);
    }
    done = true;
    _mcAG.delete(seal);
    if (ht) {
      clearTimeout(ht);
      ht = null;
    }
  };
  const cl = () => {
    try {
      if (!rs.closed && !rs.destroyed)
        rs.close(_mcH2.constants.NGHTTP2_CANCEL);
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
    P.call(rs, _mcTO());
    P.call(rs, null);
    rs.once("end", () => {
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
  _mcAG.add(seal);
  const E = rs.emit;
  rs.emit = function (ev, ...a) {
    if (ev === "aborted" && (sealed || held !== null)) return false;
    return E.call(rs, ev, ...a);
  };
  rs.once("response", (hd) => {
    try {
      conn =
        String((hd && hd["content-type"]) || "").indexOf(
          "application/connect"
        ) === 0;
      if (!conn) {
        fin();
        return;
      }
      if (trn && !act && !done) {
        act = 1;
        _mcNA++;
        _mcNT = 0;
        _mcNW();
      }
      if (want) inject();
    } catch (e) {}
  });
  rs.once("close", fin);
  rs.push = function (ch, enc) {
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
          if (_mcIsQ(env)) {
            _mcQW();
            if (!done && _mcAS()) {
              held = env;
              break;
            }
          }
        } else if (!(fl & 1)) {
          _mcTK(env.subarray(5), ts);
        }
        out.push(env);
      }
      acc = held || o >= acc.length ? null : acc.subarray(o);
      for (const e of out) r = P.call(rs, e);
      if (held && !ht) {
        ht = setTimeout(release, _mcHT);
        if (ht && ht.unref) ht.unref();
      }
      return r;
    } catch (e) {
      return P.call(rs, ch, enc);
    }
  };
  return {
    q: () => sealed || held !== null,
  };
}

function _mcAuthority(sess) {
  try {
    for (const s of Object.getOwnPropertySymbols(sess)) {
      if (s.toString() === "Symbol(authority)") return String(sess[s] || "");
    }
  } catch (e) {}
  return "";
}

function _mcWrapStream(_rs, h, _p, t, targetUrl) {
  if (!_rs || _rs.__mcStreamWrapped) return _rs;
  _rs.__mcStreamWrapped = true;
  const _isAg =
    _p.includes("/agent.v1.AgentService/") ||
    _p.includes("/StreamUnifiedChatWithTools") ||
    _p.includes("InferenceService") ||
    _p.includes("RunInference") ||
    _p.includes("/aiserver.v1.Chat") ||
    _p.includes("/aiserver.v1.Composer");
  let _ag = null;
  const _reqBody = [];
  try {
    const _ow = _rs.write ? _rs.write.bind(_rs) : null;
    if (_ow) {
      _rs.write = function (c, ...rr) {
        if (_ag && _ag.q()) {
          const cb = rr[rr.length - 1];
          if (typeof cb === "function") process.nextTick(cb);
          return true;
        }
        try {
          if (!_isAg && c != null)
            _reqBody.push(
              Buffer.isBuffer(c) ? Buffer.from(c) : Buffer.from(c)
            );
        } catch (e) {}
        return _ow(_mcPB(c), ...rr);
      };
    }
    const _oe = _rs.end ? _rs.end.bind(_rs) : null;
    if (_oe) {
      _rs.end = function (c, ...rr) {
        try {
          if (!_isAg && c != null && typeof c !== "function")
            _reqBody.push(
              Buffer.isBuffer(c) ? Buffer.from(c) : Buffer.from(c)
            );
        } catch (e) {}
        if (c == null) return _oe(...rr);
        return _oe(_mcPB(c), ...rr);
      };
    }
  } catch (e) {}
  try {
    _rs.on("response", (hd) => {
      try {
        if (hd) {
          const st = String(hd[":status"] || "");
          if (st === "429" || st === "403") _mcQW();
          if (String(hd["grpc-status"]) === "8") _mcQW();
        }
      } catch (e) {}
    });
    _rs.on("trailers", (tr) => {
      try {
        if (
          tr &&
          (String(tr["grpc-status"]) === "8" || _mcEQ(tr["grpc-message"]))
        )
          _mcQW();
      } catch (e) {}
    });
  } catch (e) {}
  if (_isAg) {
    try {
      _ag = _mcAH(
        _rs,
        t,
        _p.includes("/agent.v1.AgentService/Run") ||
          _p.includes("/StreamUnifiedChatWithTools") ||
          _p.includes("Inference") ||
          _p.includes("Chat") ||
          _p.includes("Composer")
      );
    } catch (e) {}
  } else if (_p.includes("/aiserver.v1.Ai")) {
    const _origEmit = _rs.emit.bind(_rs);
    let _fb = null;
    let _buf = [];
    let _decided = false;
    let _retrying = false;
    let _acc = null;
    const _scan = (ck) => {
      try {
        _acc = _acc ? Buffer.concat([_acc, ck]) : ck;
        let o = 0;
        while (_acc.length - o >= 5) {
          const fl = _acc[o];
          const ln = _acc.readUInt32BE(o + 1);
          if (_acc.length - o - 5 < ln) break;
          if ((fl & 0x82) !== 0) {
            const fr = _acc.slice(o, o + 5 + ln);
            if (_mcIsQ(fr)) _mcQW();
          }
          o += 5 + ln;
        }
        _acc = o > 0 ? (o < _acc.length ? _acc.slice(o) : null) : _acc;
      } catch (e) {}
    };
    _rs.emit = function (ev, ...args) {
      if (_retrying) return false;
      if (ev === "data") {
        const ch = args[0];
        const ck = Buffer.isBuffer(ch) ? ch : Buffer.from(ch);
        if (_decided) {
          _scan(ck);
          return _origEmit(ev, ...args);
        }
        try {
          _buf.push(ck);
          if (_fb === null && ck.length > 0) _fb = ck[0];
          if (_fb === null) return false;
          if ((_fb & 0x82) === 0) {
            _decided = true;
            for (const bk of _buf) {
              _scan(bk);
              _origEmit("data", bk);
            }
            _buf = null;
            return true;
          }
          return false;
        } catch (e) {
          _decided = true;
          if (_buf) {
            for (const bk of _buf) _origEmit("data", bk);
            _buf = null;
          }
          return _origEmit(ev, ...args);
        }
      }
      if (ev === "end") {
        if (_retrying) return false;
        if (!_decided && _buf && _buf.length > 0) {
          const cat = Buffer.concat(_buf);
          if (_mcIsQ(cat)) {
            _retrying = true;
            _mcQW();
            (async () => {
              try {
                const oldTk = _mcTk;
                const newTk = await _mcWT(oldTk);
                if (!newTk || !targetUrl) {
                  _retrying = false;
                  for (const bk of _buf) _origEmit("data", bk);
                  _origEmit("end");
                  return;
                }
                const nh = Object.assign({}, h);
                nh["authorization"] = "Bearer " + newTk;
                _mcPH(nh);
                const ns = _mcOC.call(_mcH2, targetUrl);
                const nr = ns.request(nh);
                try {
                  const body = Buffer.concat(_reqBody);
                  if (body.length > 0) nr.end(body);
                  else nr.end();
                } catch (e) {
                  nr.end();
                }
                nr.on("data", (c) => _origEmit("data", c));
                nr.on("end", () => {
                  _origEmit("end");
                  try {
                    ns.close();
                  } catch (e) {}
                });
                nr.on("error", (e) => {
                  _retrying = false;
                  _origEmit("error", e);
                });
              } catch (e) {
                _retrying = false;
                for (const bk of _buf) _origEmit("data", bk);
                _origEmit("end");
              }
            })();
            return false;
          }
          for (const bk of _buf) {
            _scan(bk);
            _origEmit("data", bk);
          }
          _buf = null;
          _decided = true;
        }
        return _origEmit(ev, ...args);
      }
      return _origEmit(ev, ...args);
    };
  } else {
    try {
      const _rcks = [];
      _rs.on("data", (ch) => {
        try {
          _rcks.push(Buffer.isBuffer(ch) ? ch : Buffer.from(ch));
        } catch (e) {}
      });
      _rs.on("end", () => {
        try {
          if (_rcks.length) _mcCG(Buffer.concat(_rcks), _p);
        } catch (e) {}
      });
    } catch (e) {}
  }
  return _rs;
}

try {
  const _h2 = _mcR("http2");
  _mcH2 = _h2;
  const _oC = _h2.connect;
  _mcOC = _oC;

  // 1. 原型层拦截 ClientHttp2Session.prototype.request（确保 URL 对象或提前创建的连接也能被捕获）
  let _mcProto = null;
  try {
    const _t = _oC.call(_h2, "http://127.0.0.1:1");
    _t.on("error", () => {});
    _mcProto = Object.getPrototypeOf(_t);
    try {
      _t.destroy();
    } catch (e) {}
  } catch (e) {}
  if (
    _mcProto &&
    typeof _mcProto.request === "function" &&
    !_mcProto.__mcPatched
  ) {
    _mcProto.__mcPatched = true;
    const _origProtoReq = _mcProto.request;
    _mcProto.request = function (headers, ...rest) {
      try {
        const auth = _mcAuthority(this);
        const hAuth =
          headers && (headers[":authority"] || headers["host"] || "");
        const isCursor =
          (auth &&
            (auth.includes("cursor.sh") || auth.includes("cursor.com"))) ||
          (hAuth &&
            (String(hAuth).includes("cursor.sh") ||
              String(hAuth).includes("cursor.com")));
        if (isCursor && headers && typeof headers === "object") {
          const t = _mcGT();
          if (t) headers["authorization"] = "Bearer " + t;
          _mcPH(headers);
          const _p = headers[":path"] || "";
          const _rs = _origProtoReq.call(this, headers, ...rest);
          return _mcWrapStream(
            _rs,
            headers,
            _p,
            t,
            auth || (hAuth ? "https://" + hAuth : "")
          );
        }
      } catch (e) {}
      return _origProtoReq.call(this, headers, ...rest);
    };
  }

  // 2. connect 包装层拦截
  _h2.connect = function (a, ...r) {
    const s = _oC.call(_h2, a, ...r);
    const aStr =
      typeof a === "string" ? a : a && a.href ? String(a.href) : String(a || "");
    if (aStr.includes("cursor.sh") || aStr.includes("cursor.com")) {
      const _oR = s.request.bind(s);
      s.request = function (h, ...ra) {
        const t = _mcGT();
        if (t && h) h["authorization"] = "Bearer " + t;
        _mcPH(h);
        const _p = (h && h[":path"]) || "";
        const _rs = _oR(h, ...ra);
        return _mcWrapStream(_rs, h, _p, t, aStr);
      };
    }
    return s;
  };
} catch (e) {}

try {
  const _hs = _mcR("https");
  const _oR = _hs.request;
  _hs.request = function (o, ...ra) {
    const ish =
      o &&
      typeof o === "object" &&
      o.hostname &&
      (o.hostname.includes("cursor.sh") || o.hostname.includes("cursor.com"));
    if (ish) {
      const t = _mcGT();
      if (t && o.headers) o.headers["authorization"] = "Bearer " + t;
      _mcPH(o && o.headers);
    }
    const _rq = _oR.call(_hs, o, ...ra);
    if (ish) {
      try {
        const _ow = _rq.write ? _rq.write.bind(_rq) : null;
        if (_ow) {
          _rq.write = function (c, ...rr) {
            return _ow(_mcPB(c), ...rr);
          };
        }
        const _oe = _rq.end ? _rq.end.bind(_rq) : null;
        if (_oe) {
          _rq.end = function (c, ...rr) {
            if (c == null) return _oe(...rr);
            return _oe(_mcPB(c), ...rr);
          };
        }
      } catch (e) {}
    }
    return _rq;
  };
} catch (e) {}

try {
  const _mcHttp = _mcR("http");
  const _mcOM = _mcHttp.OutgoingMessage;
  const _mcCR = _mcHttp.ClientRequest;
  const _mcIsCur = function (rq) {
    try {
      if (!rq) return false;
      const cands = [
        rq.host,
        rq.getHeader && rq.getHeader("host"),
        rq.getHeader && rq.getHeader(":authority"),
        rq.path,
      ];
      for (const c of cands) {
        if (
          c &&
          (String(c).includes("cursor.sh") || String(c).includes("cursor.com"))
        )
          return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };
  if (_mcOM && _mcOM.prototype && !_mcOM.prototype.__mcH1P) {
    _mcOM.prototype.__mcH1P = true;
    const _oS = _mcOM.prototype.setHeader;
    _mcOM.prototype.setHeader = function (n, v) {
      try {
        if (_mcIsCur(this) && typeof n === "string") {
          const ln = n.toLowerCase();
          if (ln === "authorization") {
            const t = _mcGT();
            if (t) {
              v = "Bearer " + t;
            }
          } else if (typeof v === "string") {
            const nv = _mcSR(v);
            if (nv !== v) v = nv;
          }
        }
      } catch (e) {}
      return _oS.call(this, n, v);
    };
  }
  if (_mcCR && _mcCR.prototype && !_mcCR.prototype.__mcH1BP) {
    _mcCR.prototype.__mcH1BP = true;
    const _oW = _mcCR.prototype.write;
    const _oE = _mcCR.prototype.end;
    _mcCR.prototype.write = function (c, ...rr) {
      try {
        if (_mcIsCur(this) && c != null) c = _mcPB(c);
      } catch (e) {}
      return _oW.call(this, c, ...rr);
    };
    _mcCR.prototype.end = function (c, ...rr) {
      try {
        if (_mcIsCur(this) && c != null && typeof c !== "function")
          c = _mcPB(c);
      } catch (e) {}
      return _oE.call(this, c, ...rr);
    };
  }
} catch (e) {}

try {
  if (typeof globalThis.fetch === "function" && !globalThis._mcOF2) {
    globalThis._mcOF2 = globalThis.fetch;
    globalThis.fetch = function (i, init) {
      const t = _mcGT();
      let u =
        typeof i === "string"
          ? i
          : i instanceof URL
          ? i.href
          : (i && i.url) || "";
      const ish = u && (u.includes("cursor.sh") || u.includes("cursor.com"));
      if (ish) {
        init = init || {};
        init.headers = init.headers || {};
        if (t) {
          if (typeof init.headers.set === "function")
            init.headers.set("authorization", "Bearer " + t);
          else init.headers["authorization"] = "Bearer " + t;
        }
        try {
          if (
            init.headers &&
            typeof init.headers === "object" &&
            typeof init.headers.set !== "function"
          ) {
            _mcPH(init.headers);
          } else if (
            init.headers &&
            typeof init.headers.forEach === "function"
          ) {
            const ks = [];
            init.headers.forEach((v, k) => ks.push([k, v]));
            for (const [k, v] of ks) {
              if (typeof v === "string") {
                const nv = _mcSR(v);
                if (nv !== v) init.headers.set(k, nv);
              }
            }
          }
          if (init.body != null) {
            init.body = _mcPB(init.body);
          }
        } catch (e) {}
      }
      return globalThis._mcOF2(i, init);
    };
  }
} catch (e) {}
