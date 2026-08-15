const dns = require('dns');

// Windows sometimes routes Node's DNS queries through an unreliable local
// resolver (an IPv6 link-local proxy) that flakes out on SRV lookups —
// exactly what `mongodb+srv://` needs. Pointing at public DNS directly
// sidesteps that; harmless if the local resolver is fine too. Required by
// server.js and any standalone script that connects to Mongo outside the
// main server process (seed/seedAdmin.js, seed/seedDemoRecords.js,
// scripts/migrateCourses.js).
dns.setServers(['8.8.8.8', '1.1.1.1']);
