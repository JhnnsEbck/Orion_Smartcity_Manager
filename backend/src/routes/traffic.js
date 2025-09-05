import { Router } from 'express';
import { queryByType } from '../services/orionService.js';
const r = Router();

r.get('/', async (_req, res) => {
  try { res.json(await queryByType('TrafficSensor')); }
  catch (e) { res.status(500).json({ error: String(e) }); }
});

export default r;
