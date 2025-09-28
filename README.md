# Smart City Context Hub (NGSI-LD / Orion-LD Prototype)

A compact, standards-based prototype that integrates heterogeneous urban data into a shared semantic model (NGSI‑LD) and performs event-driven derivations (e.g., NO₂) via subscriptions and a lightweight compute service.

## Architecture

- **Ingestion & Simulation**: WL adapter (real-time public transport) and Node.js simulators for `TrafficFlowObserved` and `WeatherObserved`.
- **Context Management**: FIWARE **Orion‑LD** broker + **MongoDB** persist NGSI‑LD entities with shared JSON‑LD `@context` and stable URNs.
- **Application & Compute**: Node.js/Express backend (`/api/health`, `/webhooks/compute-air`) reads notifications and PATCHes derived attributes.

URIs follow `urn:ngsi-ld:{Type}:{city}:{area}:{version}`. All payloads use `application/ld+json` with NGSI‑LD core + Smart Data Models contexts.

## Repository layout

```text
backend/
├── src/
│   ├── models/
│   │   └── ngsi/
│   │       ├── TrafficFlowObserved.js
│   │       ├── WeatherObserved.js
│   │       └── AirQualityObserved.js   # entity factories
│   ├── services/
│   │   ├── orionService.js             # upsert/get/patch
│   │   └── wl/                         # WL-API request handler
│   ├── webhooks/
│   │   └── computeAir.js               # derivation webhook
│   ├── routes/                         # optional REST routes
│   └── index.js                        # Express app
├── scripts/
│   ├── create-subscriptions.js         # creates Orion-LD subscriptions
│   └── seed-wl.js                      # seeding script with WL stop data
simulators/
├── common.js                           # NGSI-LD and context logic
├── air.js                              # AirQualityObserved simulator
├── traffic.js                          # TrafficFlowObserved simulator
└── weather.js                          # WeatherObserved simulator
docker-compose.yml
```


## Prerequisites

- Docker / Docker Compose
- Node.js 18+


## Quick start

1. **Start broker and DB**
   ```bash
   docker compose up -d
2. Start backend
    cd backend
    npm install
    npm start
    (optional Health check: http://localhost:3000/api/health)
3. Create subscriptions (idempotent)
    cd ..
    node scripts/create-subscriptions.js
4. Run simulators
    node simulators/traffic.js
    node simulators/weather.js
    node simulators/air.js
