// simulators/weather.js
import { upsert } from './common.js';
import { mkWeatherObserved } from '../backend/src/models/ngsi/WeatherObserved.js';
import { urn, AREAS } from '../backend/src/lib/ids.js';

const AREA = process.env.AREA || 'karlsplatz';
const id   = urn('WeatherObserved', AREA);

let wind = 3.5;
let temp = 22.0;

async function tick() {
  wind += (Math.random() - 0.5) * 0.8;
  temp += (Math.random() - 0.5) * 0.3;
  wind = Math.max(0, Math.round(wind * 10) / 10);
  temp = Math.round(temp * 10) / 10;

  const entity = mkWeatherObserved({
    id,
    windSpeed: wind,
    temperature: temp,
    coords: AREAS[AREA]
  });

  await upsert(entity);
  console.log(`[Weather] ${AREA} windSpeed → ${wind} m/s, temp → ${temp} °C`);
}

setInterval(tick, Number(process.env.WEATHER_MS || 1000));
tick();
