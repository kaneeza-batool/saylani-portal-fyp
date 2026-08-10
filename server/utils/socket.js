const { Server } = require('socket.io');

let io = null;

// Called once from server.js after the HTTP server is created. No per-socket
// auth handshake — the pages that open this connection are already behind
// the same cookie-based admin auth as the REST API, and nothing here
// accepts client-sent data, it's purely server -> client push.
function initSocket(httpServer, { corsOrigin } = {}) {
  io = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });
  return io;
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
