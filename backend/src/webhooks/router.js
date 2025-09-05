import { Router } from 'express';
import { getEntity, patchAttrs } from '../services/orionService.js';
import { urn } from '../lib/ids.js';

const router = Router();

router.post('/traffic', async (req, res) => {
  try {
    console.log('[Webhook] headers:', req.headers);
    console.log('[Webhook] body:', JSON.stringify(req.body, null, 2));

    const notif = req.body?.data?.[0];
    if (!notif) return res.status(204).send();

    const fallback = urn('AirQualityObserved', 'karlsplatz'); // consistent URN
    const target = notif?.affects?.object || fallback;

    const pct = Number(process.env.AIR_BUMP_PCT ?? 15);

    const current = await getEntity(target);
    const curNO2 = current?.NO2?.value ?? Number(process.env.AIR_BASE_NO2 ?? 40);

    const nextNO2 = Math.max(0, Math.round(curNO2 * (1 + pct / 100)));

    await patchAttrs(target, {
      NO2: { type: 'Property', value: nextNO2, observedAt: new Date().toISOString() }
    });

    console.log('[Webhook] Bumped NO2', curNO2, '→', nextNO2, 'for', target);
    res.json({ ok: true, target, NO2: nextNO2 });
  } catch (e) {
    console.error('[Webhook] error', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

export default router;
