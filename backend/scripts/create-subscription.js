import 'dotenv/config';
import axios from 'axios';

const ORION   = process.env.ORION_URL;
const WEBHOOK = process.env.WEBHOOK_URL;
const TH      = Number(process.env.TRAFFIC_THRESHOLD || 120);


const sub = {
  "@context": [
    "https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld",
    "https://smart-data-models.github.io/data-models/context.jsonld"
  ],
  type: 'Subscription',
  entities: [{ type: 'TrafficFlowObserved' }],
  q: `intensity>${TH}`,
  notification: {
    attributes: ['intensity','congestionLevel','affects'],
    endpoint: { uri: WEBHOOK, accept: 'application/ld+json' }
  }
};

await axios.post(`${ORION}/ngsi-ld/v1/subscriptions/`, sub, {
  headers: { 'Content-Type': 'application/ld+json' } 
});