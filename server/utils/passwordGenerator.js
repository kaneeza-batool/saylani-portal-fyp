const crypto = require('crypto');

// Avoids visually ambiguous characters (0/O, 1/l/I) since this gets read
// aloud or typed by hand when an admin shares it with a trainer.
const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';

function generatePassword(length = 12) {
  let pw = '';
  for (let i = 0; i < length; i++) {
    pw += PASSWORD_CHARS[crypto.randomInt(PASSWORD_CHARS.length)];
  }
  return pw;
}

module.exports = { generatePassword };
