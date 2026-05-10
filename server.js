require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const locationRoutes = require('./routes/locationRoutes');

const app = express();

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = Number.parseInt(process.env.PORT || '3000', 10);

if (NODE_ENV !== 'development') {
  app.set('trust proxy', 1);
}

function buildCorsOptions() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw || raw.trim() === '' || raw.trim() === '*') {
    return { origin: true };
  }
  const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (list.length === 1) {
    return { origin: list[0] };
  }
  return { origin: list };
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: parseInt(process.env.JSON_BODY_LIMIT || '16384', 10) }));

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'landmark-api' });
});

app.get('/meta', (_req, res) => {
  res.status(200).json({
    service: 'landmark-api',
    endpoints: {
      health: { method: 'GET', path: '/health' },
      locationInsights: { method: 'POST', path: '/location-insights', body: { location: 'string' } },
    },
  });
});

app.use('/location-insights', locationRoutes);
app.use(express.static(path.join(__dirname, 'public')));

app.use((err, _req, res, _next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal server error.', code: 'INTERNAL' });
});

const server = app.listen(PORT, () => {
  console.log(`[${NODE_ENV}] http://localhost:${PORT}`);
  console.log(`Health: GET http://localhost:${PORT}/health`);
  console.log(`API: POST http://localhost:${PORT}/location-insights`);
  console.log(`Tester UI: http://localhost:${PORT}/`);
});

const shutdown = () => server.close(() => process.exit(0));
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
