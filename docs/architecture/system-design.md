# Servivo — System Design

## Overview

Servivo is an on-demand marketplace connecting consumers with nearby service professionals. The system must handle real-time location data, sequential pro notification, and live status tracking — all with low latency.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Mobile App (RN)                      │
│          Consumer UI          │        Pro UI            │
└───────────────┬───────────────┴───────────┬──────────────┘
                │  REST + WebSocket          │
                ▼                            ▼
┌──────────────────────────────────────────────────────────┐
│                  API Server (Express/Node)                │
│  Auth │ Bookings │ Pros │ Matching │ Notifications │ WS  │
└───┬─────────┬────────────┬──────────────────────────┬────┘
    │         │            │                          │
    ▼         ▼            ▼                          ▼
PostgreSQL  Redis      Firebase FCM             Stripe API
(Prisma)  (Cache/PubSub) (Push notifications)  (Payments)
```

---

## Booking Flow

```
Consumer requests booking
        │
        ▼
POST /bookings
        │
        ▼
MatchingService.findNearbyPros()
  → Query DB for AVAILABLE pros within 15km
  → Sort by Haversine distance
        │
        ▼
MatchingService.dispatchBooking()
  → For each candidate (nearest first):
      1. Create BookingProResponse record
      2. Push FCM notification to pro
      3. Emit Socket.IO event to pro
      4. Wait up to 60s for accept/reject
         ├── ACCEPTED → assign pro, update booking, notify consumer
         └── REJECTED / TIMEOUT → try next candidate
        │
        ▼
If no pro accepts → booking status = EXPIRED
Consumer is notified
```

---

## Real-Time Location Updates

- Pro app sends `PUT /pros/location` every 30s while `AVAILABLE`
- Backend stores `currentLat`, `currentLng` on `Pro` record
- After booking is accepted, backend emits pro's location to consumer via Socket.IO room `booking:{id}` every 10s until job is `IN_PROGRESS`

---

## Database Design Decisions

- **PostgreSQL** — relational data with PostGIS extension for efficient geo bounding-box queries
- **Redis** — session/token cache, Socket.IO adapter for multi-instance scaling, rate limiting
- **Prisma** — type-safe ORM, migrations, seeding

---

## Scaling Considerations

- Stateless API servers behind a load balancer (ECS Fargate)
- Socket.IO uses Redis adapter so any instance can route WS events
- Geo queries can use PostGIS `ST_DWithin` for radius queries at scale
- Location updates can be offloaded to a dedicated write-optimized service
