export function mkTrafficFlowObserved({
  id,
  intensity,
  occupancy,
  averageVehicleSpeed,
  congestionLevel,
  affectsId,
  coords
}) {
  const now = new Date().toISOString();
  return {
    '@context': [
      'https://uri.etsi.org/ngsi-ld/v1/ngsi-ld-core-context.jsonld',
      'https://smart-data-models.github.io/data-models/context.jsonld'
    ],
    id,
    type: 'TrafficFlowObserved',
    dateObserved: { type: 'Property', value: now },
    intensity: { type: 'Property', value: intensity, observedAt: now },
    occupancy: { type: 'Property', value: occupancy, observedAt: now },
    averageVehicleSpeed: { type: 'Property', value: averageVehicleSpeed, observedAt: now },
    congestionLevel: { type: 'Property', value: congestionLevel, observedAt: now },
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
