// simulators/air.js
import { upsert } from './common.js';
import { mkAirQualityObserved } from '../backend/src/models/ngsi/AirQualityObserved.js';
import { urn, AREAS } from '../backend/src/lib/ids.js';

const AREA = process.env.AREA || 'karlsplatz';
const id   = urn('AirQualityObserved', AREA);

let NO2 = 40, PM10 = 18, T = 22;

async function tick() {
  NO2  += (Math.random() - 0.5) * 2;
  PM10 += (Math.random() - 0.5);
  T    += (Math.random() - 0.5) * 0.3;

  const entity = mkAirQualityObserved({
    id,
    NO2: Math.max(0, Math.round(NO2)),
    PM10: Math.max(0, Math.round(PM10)),
    temperature: Math.round(T * 10) / 10,
    coords: AREAS[AREA]
  });

  await upsert(entity);
  console.log(`[Air] ${AREA} NO2 → ${entity.NO2.value} μg/m³`);
}

setInterval(tick, Number(process.env.AIR_MS || 1000));
tick();
