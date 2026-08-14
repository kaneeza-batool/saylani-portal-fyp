const fs = require('fs');
const path = require('path');

// Minimal admin auth audit trail — every login attempt (success or failure)
// gets one JSON line, plus a console line so it shows up in the same place
// as normal server logs during development. Queryable later by reading/
// grepping the log file; no DB table for this since login-attempt volume
// on a small internal admin tool doesn't need one.
const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'admin-audit.log');

const logAdminAuthAttempt = ({ event, email, ip, reason }) => {
  const entry = {
    timestamp: new Date().toISOString(),
    event, // 'login_success' | 'login_failure'
    email,
    ip,
    ...(reason ? { reason } : {}),
  };
  const line = JSON.stringify(entry);

  console.log(`[admin-audit] ${line}`);

  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (err) {
    console.error('[admin-audit] failed to write log file:', err.message);
  }
};

module.exports = { logAdminAuthAttempt, LOG_FILE };
