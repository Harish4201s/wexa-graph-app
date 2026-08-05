require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { verifyConnectivity, closeDriver } = require('./db/cognoDriver');
const developersRouter = require('./routes/developers');
const projectsRouter = require('./routes/projects');
const skillsRouter = require('./routes/skills');
const graphRouter = require('./routes/graph');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
  })
);
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check — reports both API liveness and CognoDB reachability.
app.get('/api/health', async (req, res) => {
  const db = await verifyConnectivity();
  res.status(db.ok ? 200 : 503).json({
    api: 'ok',
    database: db.ok ? 'connected' : 'unreachable',
    ...(db.ok ? {} : { detail: db.error }),
  });
});

app.use('/api/developers', developersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/graph', graphRouter);

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler — distinguishes "DB is down" from other
// errors so the frontend can show a specific, actionable message.
app.use((err, req, res, next) => {
  console.error(err);

  const isConnectivityError =
    /ServiceUnavailable|ECONNREFUSED|Could not perform|WebSocketError/i.test(
      err.message || ''
    );

  if (isConnectivityError) {
    return res.status(503).json({
      error: 'CognoDB is currently unreachable. Please try again shortly.',
    });
  }

  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  const db = await verifyConnectivity();
  if (!db.ok) {
    console.warn(
      `⚠️  Could not verify CognoDB connectivity at startup: ${db.error}\n` +
        '   The API will still start; data routes will return 503 until the DB is reachable.'
    );
  } else {
    console.log('✅ Connected to CognoDB');
  }

  app.listen(PORT, () => {
    console.log(`🚀 API server listening on port ${PORT}`);
  });
}

process.on('SIGINT', async () => {
  await closeDriver();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await closeDriver();
  process.exit(0);
});

start();

module.exports = app;
