const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

// Called once from server.js after the HTTP server is created. Every
// connecting socket is verified here the same way authMiddleware.protect
// verifies a REST request (same cookie name, same jwt.verify, same
// User.findById) — reusing that path rather than a second auth
// implementation. A socket that fails verification is disconnected, not
// left connected-but-roomless: an unverifiable socket has no business
// receiving anything, and leaving it connected would silently reintroduce
// the exact "everyone gets everything" gap this replaces (any handler that
// forgets to check room membership would fall back to nothing, but a
// forgotten `.to(...)` on a future emit would not — better to never let an
// unverified socket linger in the first place).
function initSocket(httpServer, { corsOrigin } = {}) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  io.on('connection', async (socket) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      const token = rawCookie ? cookie.parse(rawCookie).accessToken : null;
      if (!token) {
        socket.disconnect(true);
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) {
        socket.disconnect(true);
        return;
      }

      if (user.role === 'super_admin') {
        socket.join('super-admins');
      } else if (user.role === 'sub_admin' && user.campus_id) {
        socket.join(`campus:${user.campus_id}`);
      } else {
        // Authenticated but neither role that alerts are scoped for (e.g. a
        // sub_admin somehow without a campus_id) — verified, but no room to
        // receive campus-scoped events in. Stay connected rather than
        // disconnect; this isn't an auth failure.
      }
    } catch (err) {
      socket.disconnect(true);
    }
  });

  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
