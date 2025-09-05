// simulators/traffic.js
import { upsert } from './common.js';
import { mkTrafficFlowObserved } from '../backend/src/models/ngsi/TrafficFlowObserved.js';
import { urn, AREAS } from '../backend/src/lib/ids.js';

const AREA = process.env.AREA || 'karlsplatz';
const id        = urn('TrafficFlowObserved', AREA);
const affectsId = urn('AirQualityObserved',  AREA);

const levels = ['LOW', 'MEDIUM', 'HIGH'];
let i = 0;

async function tick() {
  const level = levels[i++ % levels.length];

  const intensity = level === 'HIGH'   ? 180 : level === 'MEDIUM' ? 100 : 40;
  const occupancy = level === 'HIGH'   ? 0.9 : level === 'MEDIUM' ? 0.5 : 0.2;
  const speed     = level === 'HIGH'   ? 18  : level === 'MEDIUM' ? 32  : 45;

  const entity = mkTrafficFlowObserved({
    id,
    intensity,
    occupancy,
    averageVehicleSpeed: speed,
    congestionLevel: level,
    affectsId,
    coords: AREAS[AREA]
  });

  await upsert(entity);
  console.log(`[Traffic] ${AREA} → ${level} (intensity=${intensity})`);
}

setInterval(tick, Number(process.env.TRAFFIC_MS || 3000));
tick();
