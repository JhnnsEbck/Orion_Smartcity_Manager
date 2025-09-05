# NGSI-LD Context Data Hub — Reference Architecture (Thesis Prototype)

## Purpose
This document describes a reusable architecture for building a contextualized city data hub using **ETSI NGSI-LD** (with **Orion-LD**) and **Smart Data Models (SDM)**. The goal is to make it **easy to add new data sources**, **link** them with explicit **relationships**, and enable **event-driven** processing for derived indicators (e.g., Air Quality from Traffic + Weather).

---

## Key Concepts

### NGSI-LD Information Model
- **Entity**: Digital twin of a real-world thing (e.g., `TrafficFlowObserved`, `AirQualityObserved`).
- **Property**: Named attribute with `value` and optional `observedAt`.
- **Relationship**: Link between entities (e.g., `affects`).
- **JSON-LD `@context`**: Maps attribute names to IRIs for semantic interoperability.

### Smart Data Models (SDM)
We reuse open SDM types to improve interoperability:
- `TrafficFlowObserved` (intensity, occupancy, averageVehicleSpeed, congestionLevel, location)
- `WeatherObserved` (windSpeed, temperature, location)
- `AirQualityObserved` (NO2, PM10, temperature, location)
- `TransportStop` (from WL) — real dataset
- `PublicTransportObserved` (prototype for bus exposure) — simple model (vehicleCount, dieselShare, location)

---

## Architecture Overview

             ┌──────────────────────────────────────────┐
             │                Adapters                  │
             │  (WL, Traffic, Weather, PublicTransport) │
             │  fetchRaw() → mapToSDM() → upsert()      │
             └───────────────┬──────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Canonical NGSI-LD Layer (Backend) │
│ models/ngsi/* → pure entity builders (SDM aligned) │
│ orionService → POST/PATCH/GET/Subscriptions │
│ ids.js → stable URNs + area locations │
└───────────────────────┬──────────────────────────────────────────┘
│ (upserts)
▼
┌──────────────────────────────────────────┐
│ Orion-LD │
│ Context graph + Subscriptions/Queries │
└───────────────┬──────────────────────────┘
│ (HTTP POST notifications)
▼
┌───────────────────────────────────────────┐
│ Context Processor │
│ /webhooks/compute-air │
│ - read Traffic + Weather (+ PT) │
│ - derive NO₂ (simple formula) │
│ - patch AirQualityObserved │
└───────────────────────────────────────────┘
│
▼
Read API (/api/*) for dashboards

---

## Folder Structure (essential parts)

backend/
  src/
    index.js
    routes/
      air.js                    # GET /api/air
      traffic.js                # GET /api/traffic
      transport.js              # GET /api/transport
    models/ngsi/
      AirQualityObserved.js
      TrafficFlowObserved.js
      WeatherObserved.js
      PublicTransportObserved.js
      TransportStop.js          # ← your existing WL stop entity (keep)
    lib/
      ids.js                    # URN & area helpers (e.g., urn(type, area))
    services/
      orionService.js           # POST/PATCH/GET/Subscriptions for Orion
      wl/
        dataFetcher.js          # calls Wiener Linien API
        urlBuilder.js
        csvReader.js
        wlService.js            # pollByDiva(), seedFromCsv(), + new: emit PT
    webhooks/
      router.js                 # (legacy) /webhooks/traffic
      computeAir.js             # /webhooks/compute-air (derive NO2)
  scripts/
    create-subscription.js          # (legacy) Traffic→/webhooks/traffic
    create-subscriptions-compute.js # Traffic/Weather/PT → /webhooks/compute-air
  data/
    diva_numbers.csv

simulators/
  common.js                 # header + optional @context (NGSI_MODE)
  air.js                    # emits AirQualityObserved
  traffic.js                # emits TrafficFlowObserved (affects→Air)
  weather.js                # emits WeatherObserved
  publicTransport.js        # emits PublicTransportObserved (simulated)


---

## ID & Area Scheme
We use stable URNs and known coordinates per area (e.g., Karlsplatz):


Example:
- `urn:ngsi-ld:TrafficFlowObserved:vienna:karlsplatz:v1`
- `urn:ngsi-ld:AirQualityObserved:vienna:karlsplatz:v1`

---

## Event-Driven Derivation (NO₂)
We subscribe to changes in **Traffic** (intensity), **Weather** (windSpeed), and (optionally) **Public Transport** (vehicleCount/dieselShare). Each event triggers the context processor to compute:

NO2 = base
+ a * trafficIntensity
+ b * vehicleCount * dieselShare
- c * windSpeed
+ noise



Parameters (`base`, `a`, `b`, `c`) are `.env` tunables; this is a **proxy** that illustrates how to combine multiple sources, not a full dispersion model.

---

## Adding a New Source (Playbook)
1. **Pick SDM or define a minimal model builder** in `models/ngsi/`.
2. **Create adapter folder** `adapters/<source>/`:
   - `fetcher.js`  → `fetchRaw()`
   - `mapper.js`   → `mapToEntities(raw)` returning SDM entities
   - `service.js`  → `ingestOnce()` calls upsert for each entity
3. **Define IDs and location** with `ids.js`.
4. **Upsert** via `orionService`.
5. **Link** to other context via **Relationships** (e.g., `affects`).
6. **Optionally subscribe** to attributes that matter and process in a webhook.
7. **Document** 1–2 ADRs for decisions (SDM choice, @context vs normalized).

---

## Metrics to Report (Thesis)
- Integration effort: files/LOC changed to add a source
- Interoperability: % attributes from SDM; JSON-LD runs with `@context`
- Context usage: number of relationships; cross-entity joins per event
- Responsiveness: event→update latency (p50/p95)
- Extensibility: time to add new dataset; tests needed
