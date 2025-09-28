export function mkWeatherObserved({ 
  id, 
  windSpeed, 
  temperature, 
  coords, 
  affectsId 
}) {
  const now = new Date().toISOString();
  return {
    '@context': [
      'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld',
      'https://smart-data-models.github.io/data-models/context.jsonld'
    ],
    id,
    type: 'WeatherObserved',
    dateObserved: { type: 'Property', value: now },
    windSpeed: { type: 'Property', value: windSpeed, observedAt: now },
    temperature: { type: 'Property', value: temperature, observedAt: now },
    location: {
      type: 'GeoProperty',
      value: { type: 'Point', coordinates: coords },
      observedAt: now
    },
    affects: affectsId
      ? { type: 'Relationship', object: affectsId, observedAt: now }
      : undefined
  };
}
