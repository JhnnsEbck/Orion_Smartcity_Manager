// backend/src/lib/ids.js
export const CITY = 'vienna';

export const AREAS = {
  karlsplatz: [16.368000, 48.200000],
};

export const RELEVANT_STOPS = ['Karlsplatz', 'Oper/Karlsplatz U'];

export function urn(type, area, local = 'v1') {
  return `urn:ngsi-ld:${type}:${CITY}:${area}:${local}`;
}

export function isBusVehicle(vehicleType) {
  if (!vehicleType) return false;
  const s = String(vehicleType).toLowerCase();
  return s.includes('bus');
}

export function resolveAreaForStopName(stopName) {
  if (!stopName) return null;
  const s = String(stopName).toLowerCase();
  return RELEVANT_STOPS.some(n => String(n).toLowerCase() === s) ? 'karlsplatz' : null;
}
