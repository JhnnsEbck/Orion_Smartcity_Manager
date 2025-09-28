import 'dotenv/config';
import axios from 'axios';

const ORION = process.env.ORION_URL || 'http://localhost:1026';
const MODE  = (process.env.NGSI_MODE || 'json').toLowerCase();

function headers() {
  return { 'Content-Type': MODE === 'jsonld' ? 'application/json': 'application/ld+json' };
}
function withContext(e) {
  if (MODE !== 'jsonld') return e;
  return {
    '@context': [
      'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld',
      'https://smart-data-models.github.io/data-models/context.jsonld'
    ],
    ...e
  };
}

export async function upsert(entity) {
  const body = withContext(entity);
  try {
    await axios.post(`${ORION}/ngsi-ld/v1/entities/`, body, { headers: headers() });
  } catch (err) {
    if (err.response?.status === 409) {
      const attrs = { ...body }; delete attrs.id; delete attrs.type;
      await axios.patch(`${ORION}/ngsi-ld/v1/entities/${encodeURIComponent(entity.id)}/attrs`, attrs, { headers: headers() });
    } else {
      console.error('Upsert error:', err.response?.status, err.response?.data || err.message);
      throw err;
    }
  }
}

