import { upsert } from './common.js';
import { mkWeatherObserved } from '../backend/src/models/ngsi/WeatherObserved.js';
import { urn, AREAS } from '../backend/src/lib/ids.js';

const AREA = process.env.AREA || 'karlsplatz';
const id   = urn('WeatherObserved', AREA);

async function tick() {

  let wind = 3.5;   // m/s
  let temp = 22.0;  // °C
  let tickN = 0;
  tickN += 1;
  
  function round1(x) { return Math.round(x * 10) / 10; }

  wind += (Math.random() - 0.5) * 0.6;
  temp += (Math.random() - 0.5) * 0.3;

  if (tickN % 5 === 0) {
    wind += 3.0;
  }

  if (tickN % 6 === 0) {
    wind -= 3.0;
  }

  wind = Math.max(0, Math.min(12, round1(wind)));
  temp = round1(temp);

  const entity = mkWeatherObserved({
    id,
    windSpeed: wind,
    temperature: temp,
    coords: AREAS[AREA]
  });

  await upsert(entity);
  const ts = new Date().toISOString();
  console.log(`[Weather][${ts}] area=${AREA} wind=${wind.toFixed(1)}m/s temp=${temp.toFixed(1)}°C`);
  tickN = 0;
}

const MS = Number(3000);
setInterval(tick, MS);
tick();
