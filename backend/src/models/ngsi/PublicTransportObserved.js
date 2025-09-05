export function mkPublicTransportObserved({ id, vehicleCount, dieselShare, coords, affectsId, ts }) {
  const t = ts || new Date().toISOString();
  const e = {
    id, type:'PublicTransportObserved',
    vehicleCount: { type:'Property', value: vehicleCount, observedAt:t },
    dieselShare:  { type:'Property', value: dieselShare,  observedAt:t },
  };
  if (coords) e.location = { type:'GeoProperty', value:{ type:'Point', coordinates: coords }, observedAt:t };
  if (affectsId) e.affects  = { type:'Relationship', object: affectsId, observedAt:t };
  return e;
}
