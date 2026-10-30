const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = require('./app');
const { pool } = require('./config/db');

const port = Number.parseInt(process.env.PORT, 10) || 5000;

const server = app.listen(port, () => {
  console.log(`CRM API listening on port ${port}`);
});

server.on('error', (error) => {
  console.error('Server failed to start:', error.message);
  process.exit(1);
});

function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down.`);
  server.close(async () => {
    try {
      await pool.end();
    } catch (error) {
      console.error('Error closing database pool:', error.message);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
