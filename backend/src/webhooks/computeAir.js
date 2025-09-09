import { Router } from 'express';
import { getEntity, upsertEntityFast } from '../services/orionService.js';

const router = Router();
const CTX = [
  'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld',
  'https://smart-data-models.github.io/data-models/context.jsonld'
];

router.post('/compute-air', async (req, res) => {
  try {
    
    const target = req.body?.targetId || 'urn:ngsi-ld:AirQualityObserved:vienna:karlsplatz:v1';
    const loc = { type: 'GeoProperty', value: { type: 'Point', coordinates: [16.368, 48.200] } };

    // ensure base entity exists (upsert)
    await upsertEntityFast({
      '@context': CTX,
      id: target,
      type: 'AirQualityObserved',
      location: loc

    });

    // compute next NO2
    const base = (await getEntity(target)) || {};
    const prev = Number(base?.NO2?.value ?? 35);
    const next = Math.max(0, Math.round(prev * 1.05)); // +5% demo

    // patch NO2
    await upsertEntityFast({
      '@context': CTX,
      id: target,
      type: 'AirQualityObserved',
      NO2: { type: 'Property', value: next, observedAt: new Date().toISOString() }
    });

    console.log('[ComputeAir] set NO2', prev, '→', next, 'for', target);
    res.json({ ok: true, target, NO2: next });
  } catch (e) {
    console.error('[ComputeAir] error', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

export default router;
