// backend/src/models/ngsi/AirQualityObserved.js
export function mkAirQualityObserved({ 
  id, 
  NO2, 
  PM10, 
  temperature, 
  coords
}) {
  const now = new Date().toISOString();
  return {
    '@context': [
      'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld',
      'https://smart-data-models.github.io/data-models/context.jsonld'
    ],
    id,
    type: 'AirQualityObserved',
    dateObserved: { type: 'Property', value: now },
    NO2:          { type: 'Property', value: NO2, observedAt: now },
    PM10:         { type: 'Property', value: PM10, observedAt: now },
    temperature:  { type: 'Property', value: temperature, observedAt: now },
    ...(coords && {
      location: {
        type:       'GeoProperty',
        value:      { type: 'Point', coordinates: coords },
        observedAt: now
      }
    })
  };
}
