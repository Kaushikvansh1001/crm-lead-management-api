const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { query } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      database: 'connected',
    });
  } catch (error) {
    console.error('Database health check failed:', error.message);
    res.status(503).json({
      status: 'error',
      database: 'unreachable',
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/enquiries', enquiryRoutes);

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const isInvalidJson = error instanceof SyntaxError
    && (error.status === 400 || error.statusCode === 400);

  if (isInvalidJson) {
    console.error('Rejected a request with invalid JSON');
    res.status(400).json({
      status: 'error',
      message: 'Invalid JSON body',
    });
    return;
  }

  console.error(error.message);

  const status = Number(error.status || error.statusCode) || 500;
  res.status(status).json({
    status: 'error',
    message: status >= 500 ? 'Internal server error' : error.message,
  });
});

module.exports = app;
