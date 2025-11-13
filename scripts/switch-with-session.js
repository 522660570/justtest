#!/usr/bin/env node
/**
 * Switch Cursor account using only email + SessionToken
 * - Closes Cursor
 * - Writes to SQLite (state.vscdb):
 *   - cursorAuth/cachedEmail
 *   - cursorAuth/cachedSignUpType = Auth_0
 *   - WorkosCursorSessionToken
 * - Starts Cursor
 *
 * Usage (PowerShell):
 *   node scripts/switch-with-session.js --email "user@example.com" --session "user_01XXX%3A%3AeyJ..."
 */

const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const { exec, spawn } = require('child_process');

const argv = require('node:util').parseArgs({
  options: {
    email: { type: 'string', short: 'e' },
    session: { type: 'string', short: 's' },
    'no-start': { type: 'boolean' },
    'dry-run': { type: 'boolean' },
  }
}).values;

function log(...args) { console.log('[switch-with-session]', ...args); }
function error(...args) { console.error('[switch-with-session]', ...args); }

async function fileExists(p) { try { await fsp.access(p); return true; } catch { return false; } }

async function findStateDb() {
  const home = os.homedir();
  const candidates = [];
  if (process.platform === 'win32') {
    const roaming = path.join(home, 'AppData', 'Roaming');
    const local = path.join(home, 'AppData', 'Local');
    candidates.push(
      path.join(roaming, 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
      path.join(local, 'Cursor', 'User', 'globalStorage', 'state.vscdb'),
      path.join(roaming, 'cursor', 'User', 'globalStorage', 'state.vscdb'),
      path.join(local, 'cursor', 'User', 'globalStorage', 'state.vscdb')
    );
  } else if (process.platform === 'darwin') {
    candidates.push(path.join(home, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage', 'state.vscdb'));
  } else {
    candidates.push(path.join(home, '.config', 'Cursor', 'User', 'globalStorage', 'state.vscdb'));
    candidates.push(path.join(home, '.config', 'cursor', 'User', 'globalStorage', 'state.vscdb'));
  }

  for (const p of candidates) {
    if (await fileExists(p)) return p;
  }
  return null;
}

function killCursorWin() {
  return new Promise((resolve) => {
    const cmds = [
      'taskkill /IM Cursor.exe 2>nul',
      'taskkill /IM "Cursor Helper.exe" 2>nul',
      'taskkill /IM "Cursor Helper (Renderer).exe" 2>nul',
      'taskkill /IM "Cursor Helper (GPU).exe" 2>nul',
      'taskkill /IM "Cursor Helper (Plugin).exe" 2>nul',
      'timeout /t 2 /nobreak >nul 2>&1',
      'taskkill /F /IM Cursor.exe 2>nul',
      'taskkill /F /IM "Cursor Helper.exe" 2>nul',
      'taskkill /F /IM "Cursor Helper (Renderer).exe" 2>nul',
      'taskkill /F /IM "Cursor Helper (GPU).exe" 2>nul',
      'taskkill /F /IM "Cursor Helper (Plugin).exe" 2>nul'
    ].join(' && ');
    exec(cmds, () => resolve());
  });
}

async function backupFile(file) {
  try {
    const buf = await fsp.readFile(file);
    const bak = file + '.' + Date.now() + '.bak';
    await fsp.writeFile(bak, buf);
    log('Backup created:', bak);
  } catch (e) {
    error('Backup failed:', e.message);
  }
}

async function upsertKeys(dbPath, kv) {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();
  const buf = await fsp.readFile(dbPath);
  const db = new SQL.Database(buf);
  try {
    for (const [key, value] of Object.entries(kv)) {
      if (value == null) continue;
      db.run('INSERT OR REPLACE INTO ItemTable (key, value) VALUES (?, ?)', [key, String(value)]);
    }
    const out = db.export();
    await fsp.writeFile(dbPath, Buffer.from(out));
  } finally {
    db.close();
  }
}

async function findCursorExeWin() {
  const local = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const common = [
    path.join(local, 'Programs', 'Cursor', 'Cursor.exe'),
    'C://Program Files//Cursor//Cursor.exe',
    'C://Program Files (x86)//Cursor//Cursor.exe',
    'D://Cursor//Cursor.exe',
    'E://Cursor//Cursor.exe'
  ];
  for (const p of common) { if (await fileExists(p)) return p; }
  return null;
}

async function startCursorWin() {
  const exe = await findCursorExeWin();
  if (!exe) {
    error('Cursor.exe not found in common locations. You may start it manually.');
    return;
  }
  log('Starting Cursor:', exe);
  spawn(exe, [], { detached: true, stdio: 'ignore', windowsHide: false }).unref();
}

(async () => {
  try {
    if (process.platform !== 'win32') {
      error('This helper script currently supports Windows only.');
      process.exit(1);
    }

    const email = argv.email || argv.e;
    const session = argv.session || argv.s;
    if (!email || !session) {
      error('Missing required params.');
      console.log('Usage: node scripts/switch-with-session.js --email "user@example.com" --session "user_01XXX%3A%3AeyJ..."');
      process.exit(1);
    }

    log('Killing Cursor processes...');
    await killCursorWin();

    const dbPath = await findStateDb();
    if (!dbPath) {
      error('state.vscdb not found. Launch Cursor once to initialize profile, then retry.');
      process.exit(2);
    }
    log('Found state.vscdb:', dbPath);

    await backupFile(dbPath);

    if (argv['dry-run']) {
      log('Dry-run enabled. Skipping DB write and start.');
      process.exit(0);
    }

    // Normalize session token: ensure %3A%3A separator
    let sessionToken = session;
    if (!session.includes('%3A%3A') && session.includes('::')) {
      sessionToken = session.replace(/::/g, '%3A%3A');
      log('Normalized session token (:: -> %3A%3A)');
    }

    const kv = {
      'cursorAuth/cachedEmail': email,
      'cursorAuth/cachedSignUpType': 'Auth_0',
      'WorkosCursorSessionToken': sessionToken
    };

    log('Writing auth keys into SQLite...');
    await upsertKeys(dbPath, kv);
    log('SQLite update complete.');

    if (!argv['no-start']) {
      await startCursorWin();
      log('Cursor start command issued. Wait a few seconds, then verify in UI.');
    } else {
      log('no-start flag set. Not starting Cursor.');
    }

    log('Done.');
  } catch (e) {
    error('Failed:', e.message);
    process.exit(1);
  }
})();
