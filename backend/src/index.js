import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';

import { orionInfo } from './services/orionService.js';

// API routers
import trafficRouter from './routes/traffic.js';
import airRouter from './routes/air.js';

// Webhooks
import computeAirRouter from './webhooks/computeAir.js';
import webhookRouter from './webhooks/router.js';        

// WL poller
import { startWLPoller } from './services/wl/wlService.js';

const app = express();
app.use(morgan('dev'));
app.use(express.json({ type: ['application/json', 'application/ld+json'] }));

// health
app.get('/api/health', async (_req, res) => {
  try {
    const info = await orionInfo();
    res.json({ ok: true, orion: info });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// API routes
app.use('/api/traffic', trafficRouter);
app.use('/api/air',     airRouter);

// Webhook routes
app.use('/webhooks', computeAirRouter);
app.use('/webhooks', webhookRouter);

startWLPoller();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
