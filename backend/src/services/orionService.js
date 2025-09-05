import 'dotenv/config';
import axios from 'axios';

const ORION = process.env.ORION_URL || 'http://localhost:1026';

// Canonical contexts (core + Smart Data Models)
const CORE = 'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld';
const SDM  = 'https://smart-data-models.github.io/data-models/context.jsonld';
const CTX  = [CORE, SDM];

// Always send JSON-LD and include Link so Orion can expand/compact properly
const JSONLD_WRITE = { 'Content-Type': 'application/ld+json' };
const JSONLD_READ  = {
  'Accept': 'application/ld+json',
  'Link': `<${CORE}>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json", ` +
          `<${SDM}>;  rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"`
};

// Ensure @context is present when we write (POST/PATCH)
function withContext(body) {
  if (!body) return body;
  if (Array.isArray(body)) return body.map(b => withContext(b));
  if (body['@context']) return body;
  return { '@context': CTX, ...body };
}

/** Orion /version (used by /api/health) */
export async function orionInfo() {
  const { data } = await axios.get(`${ORION}/version`);
  return data;
}

/** GET a single entity (returns null if 404) */
export async function getEntity(entityId) {
  try {
    const { data } = await axios.get(
      `${ORION}/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}`,
      { headers: JSONLD_READ }
    );
    return data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
}

/** POST create a new entity (JSON-LD) */
export async function createEntity(entity) {
  const body = withContext(entity);
  await axios.post(
    `${ORION}/ngsi-ld/v1/entities/`,
    body,
    { headers: JSONLD_WRITE }
  );
}

/** PATCH attributes on an entity (JSON-LD) */
export async function updateEntity(entityId, updatedAttributes) {
  const body = withContext(updatedAttributes);
  await axios.patch(
    `${ORION}/ngsi-ld/v1/entities/${encodeURIComponent(entityId)}/attrs`,
    body,
    { headers: JSONLD_WRITE }
  );
}

/** Upsert: create or patch depending on existence */
export async function upsertEntity(entity) {
  const existing = await getEntity(entity.id);
  if (existing) {
    const attrs = { ...entity }; delete attrs.id; delete attrs.type;
    await updateEntity(entity.id, attrs);
    return { created: false };
  } else {
    await createEntity(entity);
    return { created: true };
  }
}

/** Faster upsert: try create, on 409 do patch */
export async function upsertEntityFast(entity) {
  try {
    await createEntity(entity);
    return { created: true };
  } catch (err) {
    if (err.response?.status === 409) {
      const attrs = { ...entity }; delete attrs.id; delete attrs.type;
      await updateEntity(entity.id, attrs);
      return { created: false };
    }
    throw err;
  }
}

/** Query by type (make Link available so short type works) */
export async function queryByType(type) {
  const { data } = await axios.get(
    `${ORION}/ngsi-ld/v1/entities`,
    { params: { type }, headers: JSONLD_READ }
  );
  return data;
}

/** Generic PATCH attrs helper (used by webhook) */
export async function patchAttrs(id, attrs) {
  const body = withContext(attrs);
  await axios.patch(
    `${ORION}/ngsi-ld/v1/entities/${encodeURIComponent(id)}/attrs`,
    body,
    { headers: JSONLD_WRITE }
  );
}

/** Create subscription (JSON-LD with @context) */
export async function createSubscription(subDef) {
  const body = withContext(subDef);
  await axios.post(
    `${ORION}/ngsi-ld/v1/subscriptions/`,
    body,
    { headers: JSONLD_WRITE }
  );
}
