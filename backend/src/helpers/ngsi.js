export const now = () => new Date().toISOString();
export const prop = (value, t = now()) => ({ type: 'Property', value, observedAt: t });
export const geo  = (coords, t = now()) => ({ type: 'GeoProperty', value: { type: 'Point', coordinates: coords }, observedAt: t });
export const rel  = (object, t = now()) => ({ type: 'Relationship', object, observedAt: t });
