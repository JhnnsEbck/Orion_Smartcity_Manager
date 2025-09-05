import 'dotenv/config';
import axios from 'axios';

const ORION = process.env.ORION_URL || 'http://localhost:1026';
const WEBHOOK = process.env.WEBHOOK_URL_COMPUTE || 'http://host.docker.internal:3000/webhooks/compute-air';
const H = { headers: { 'Content-Type': 'application/json' } };

const subs = [
  {
    type: 'Subscription',
    entities: [{ type: 'TrafficFlowObserved' }],
    watchedAttributes: ['intensity'],
    notification: { format:'normalized', attributes:['intensity'], endpoint:{ uri: WEBHOOK, accept:'application/json' } }
  },
  {
    type: 'Subscription',
    entities: [{ type: 'WeatherObserved' }],
    watchedAttributes: ['windSpeed'],
    notification: { format:'normalized', attributes:['windSpeed'], endpoint:{ uri: WEBHOOK, accept:'application/json' } }
  },
  {
    type: 'Subscription',
    entities: [{ type: 'PublicTransportObserved' }],
    watchedAttributes: ['vehicleCount','dieselShare'],
    notification: { format:'normalized', attributes:['vehicleCount','dieselShare'], endpoint:{ uri: WEBHOOK, accept:'application/json' } }
  }
];

for (const sub of subs) {
  try {
    const r = await axios.post(`${ORION}/ngsi-ld/v1/subscriptions/`, sub, H);
    console.log('Created sub for', sub.entities[0].type, '→', r.status);
  } catch (e) {
    console.error('Sub error', e.response?.status, e.response?.data || e.message);
  }
}
