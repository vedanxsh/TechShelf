const http = require('http');
const app = require('./src/app');
const config = require('./src/config');

const server = http.createServer(app);

server.listen(config.port, config.host, () => {
  const localUrl = `http://localhost:${config.port}/`;
  const networkUrl = `http://${config.localIp}:${config.port}/`;

  console.log(`\n======================================================`);
  console.log(`⚡ ${config.appName} v2.0.0 (Production Ready)`);
  console.log(`======================================================`);
  console.log(`  Mode         : ${config.env}`);
  console.log(`  Local Access : ${localUrl}`);
  console.log(`  Multi-Device : ${networkUrl}  <-- Use on phones/tablets`);
  console.log(`  Health Check : ${localUrl}api/health`);
  console.log(`======================================================`);
  console.log(`  Default Accounts:`);
  console.log(`  - Student    : ID: vedansh    | Pass: password123 (₹850 wallet)`);
  console.log(`  - Student    : ID: student101 | Pass: student123  (₹420 wallet)`);
  console.log(`  - Cafeteria  : ID: cafe1      | Pass: cafe123`);
  console.log(`  - Cafeteria  : ID: admin      | Pass: admin123`);
  console.log(`======================================================\n`);
});

// Graceful Shutdown Handlers
function handleShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed. Process terminating.');
    process.exit(0);
  });

  // Force exit after 5 seconds if connections linger
  setTimeout(() => {
    console.error('[Server] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = server;
