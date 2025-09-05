import { upsertEntity } from '../orionService.js';
import TransportStop from '../../models/ngsi/TransportStop.js';
import { mkPublicTransportObserved } from '../../models/ngsi/PublicTransportObserved.js';
import { AREAS, urn, resolveAreaForStopName, isBusVehicle } from '../../lib/ids.js';
import { fetchData } from './dataFetcherService.js';

function readStopNameFromMonitor(m) {
  return m?.locationStop?.properties?.title || m?.properties?.title || null;
}

function countUpcomingBuses(monitors, windowMin = 10) {
  const now = Date.now();
  const winMs = windowMin * 60 * 1000;
  let count = 0;

  for (const m of monitors) {
    const lines = m?.lines || [];
    for (const line of lines) {
      const deps = line?.departures?.departure || [];
      for (const dep of deps) {
        const v = dep?.vehicle;
        if (!v || !isBusVehicle(v.type)) continue;

        const iso = dep?.departureTime?.timeReal || dep?.departureTime?.timePlanned;
        if (!iso) continue;

        const ts = Date.parse(iso); // if not ISO, adapt parsing
        if (!Number.isNaN(ts) && ts >= now && ts <= now + winMs) count++;
      }
    }
  }
  return count;
}

export async function pollByDiva(divaNumber) {
  const res = await fetchData(divaNumber);
  const monitorsArr = res?.data?.monitors || res?.monitors;
  if (!Array.isArray(monitorsArr) || monitorsArr.length === 0) return 0;

  // group monitors by stopId (rbl)
  const grouped = monitorsArr.reduce((acc, m) => {
    const rbl = m?.locationStop?.properties?.attributes?.rbl
             || m?.properties?.attributes?.rbl;
    if (!rbl) return acc;
    (acc[rbl] ||= []).push(m);
    return acc;
  }, {});

  let written = 0;

  for (const [, monitors] of Object.entries(grouped)) {
    // Upsert TransportStop entity
    const stopEntity = new TransportStop(monitors, divaNumber);
    await upsertEntity(stopEntity);
    written++;

    // If stop is relevant, derive PT exposure -> affects Air
    const stopName = stopEntity?.name?.value || readStopNameFromMonitor(monitors[0]);
    const area = resolveAreaForStopName(stopName);
    if (!area) continue;

    const coords = stopEntity?.location?.value?.coordinates || AREAS.karlsplatz;
    const vehicleCount = countUpcomingBuses(monitors, Number(process.env.PT_WINDOW_MIN || 10));
    if (vehicleCount === 0) continue;

    const dieselShare  = Number(process.env.PT_DIESEL_SHARE || 0.4);
    const ptId  = urn('PublicTransportObserved', area);
    const airId = urn('AirQualityObserved', area);

    const ptEntity = mkPublicTransportObserved({
      id: ptId,
      vehicleCount,
      dieselShare,
      coords,
      affectsId: airId
    });

    await upsertEntity(ptEntity);
    console.log(`[WL→PT] stop="${stopName}" area=${area} busCount=${vehicleCount}`);
  }

  return written;
}

// helper to poll multiple divas continuously
export function startWLPoller() {
  const divas = (process.env.WL_DIVAS || '').split(',').map(s => s.trim()).filter(Boolean);
  const interval = Number(process.env.WL_POLL_MS || 15000);
  if (divas.length === 0) return;

  setInterval(async () => {
    for (const diva of divas) {
      try {
        const n = await pollByDiva(diva);
        if (n > 0) console.log(`[WL] diva=${diva} upserted ${n} stop(s)`);
      } catch (e) {
        console.error('[WL] poll error', diva, e.message);
      }
    }
  }, interval);
}
