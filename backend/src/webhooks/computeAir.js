import { Router } from 'express';
import { getEntity, upsertEntityFast } from '../services/orionService.js';

const router = Router();
const CTX = [
  'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld',
  'https://smart-data-models.github.io/data-models/context.jsonld'
];

const NO2_MAX = Number(process.env.NO2_MAX || 120);
const clamp = x => Math.max(0, Math.min(NO2_MAX, x));

// Helper: derive AQO URN from a WeatherObserved URN: urn:ngsi-ld:WeatherObserved:{city}:{area}:{version}
function deriveAqoFromWeatherUrn(weatherUrn) {
  try {
    const parts = String(weatherUrn).split(':'); // ['urn','ngsi-ld','WeatherObserved','{city}','{area}','{version}']
    const city = parts[3] || 'vienna';
    const area = parts[4] || 'karlsplatz';
    const version = parts[5] || 'v1';
    return `urn:ngsi-ld:AirQualityObserved:${city}:${area}:${version}`;
  } catch {
    return 'urn:ngsi-ld:AirQualityObserved:vienna:karlsplatz:v1';
  }
}

router.post('/compute-air', async (req, res) => {
  try {
    console.log('[DEBUG] raw body', JSON.stringify(req.body));

    // Normalized NGSI-LD notification shape: { data: [ { id, type, ... } ] }
    const notif = Array.isArray(req.body) ? req.body[0] : req.body;
    const e = notif?.data?.[0] || null;

    // Target selection: explicit > derived from WeatherObserved > default
    let target =
      req.body?.targetId ||
      (e?.type === 'WeatherObserved' && e?.id ? deriveAqoFromWeatherUrn(e.id) : null) ||
      'urn:ngsi-ld:AirQualityObserved:vienna:karlsplatz:v1';

    // Ensure base entity exists (keeps identity/links)
    const loc = { type: 'GeoProperty', value: { type: 'Point', coordinates: [16.368, 48.200] } };
    await upsertEntityFast({ '@context': CTX, id: target, type: 'AirQualityObserved', location: loc });

    // Read previous NO2 (if any)
    const base = (await getEntity(target)) || {};
    const prev = Number(base?.NO2?.value ?? 35);

    let next = prev;

    // Weather branch: dampen NO2 by windSpeed and log clearly
    if (e && e.type === 'WeatherObserved' && e.windSpeed) {
      const wind = Number(e.windSpeed?.value ?? e.windSpeed);
      const k = 1.5; // damping factor per m/s
      next = clamp(Math.round(prev - k * wind));
      const sub = req.query?.subscriptionId || '-';
      console.log(
        `[ComputeAir][Weather] sub=${sub} \nid=${e.id} \nwind=${wind.toFixed(1)}m/s ` +
        `NO2 ${prev}→${next} target=${target}`
      );
    } else {
      // Default path for other signals (e.g., traffic/PT). Keep bounded for readability.
      next = clamp(Math.round(prev * 1.05)); // +5%, clamped
      const sub = req.query?.subscriptionId || '-';
      const et  = e?.type || 'unknown';
      console.log(
        `\n[ComputeAir][Other]   \nsub=${sub} \ntype=${et} ` +
        `NO2 ${prev}→${next} target=${target}`
      );
    }

    // Patch NO2 with fresh observedAt
    await upsertEntityFast({
      '@context': CTX,
      id: target,
      type: 'AirQualityObserved',
      NO2: { type: 'Property', value: next, observedAt: new Date().toISOString() }
    });

    res.json({ ok: true, target, NO2: next });
  } catch (e) {
    console.error('[ComputeAir] error', e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

export default router;
