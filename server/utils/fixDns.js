const dns = require('dns');

// Windows sometimes routes Node's DNS queries through an unreliable local
// resolver (an IPv6 link-local proxy) that flakes out on SRV lookups —
// exactly what `mongodb+srv://` needs. Pointing at public DNS directly
// sidesteps that; harmless if the local resolver is fine too. Required by
// both server.js and any standalone script (seedSuperAdmin.js, ml training)
// that connects to Mongo outside the main server process.
dns.setServers(['8.8.8.8', '1.1.1.1']);
