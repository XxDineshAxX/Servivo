# Servivo

On-demand service booking — connect consumers with the nearest available pro in under 60 minutes.

## Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + npm workspaces |
| Web frontend | React 18 + Vite + TypeScript |
| Mobile | Expo (React Native) + TypeScript |
| Real-time backend | Firebase Firestore |
| Auth | Firebase Authentication (consumer + pro flows) |
| Maps | Mapbox GL JS (web) / `@rnmapbox/maps` (mobile) |
| Push notifications | Firebase Cloud Messaging (FCM) |
| Scheduling | Custom Haversine + availability engine (`@servivo/scheduling`) |

## Project Structure

```
servivo/
├── apps/
│   ├── web/          # React + Vite consumer & pro web app
│   └── mobile/       # Expo consumer & pro mobile app
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── firebase/     # Firebase config & Firestore helpers
│   ├── scheduling/   # Haversine distance + availability queries
│   └── ui/           # Shared UI primitives
└── infra/
    └── firebase/     # Firestore rules, indexes, Cloud Functions (FCM)
```

## Getting Started

1. **Clone & install**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Fill in Firebase and Mapbox keys
   ```

3. **Run web dev server**
   ```bash
   npm run web
   ```

4. **Run mobile (Expo)**
   ```bash
   npm run mobile
   ```

## Key Features

- **Live map** — Mapbox shows nearby pro locations with real-time position updates
- **60-minute availability window** — queries Firestore for pros whose next slot opens within the hour, sorted by Haversine distance
- **Consumer flow** — find nearest available pro → send booking request → track status on map
- **Pro flow** — receive FCM push notification → accept or reject → navigate to consumer
- **Separate auth** — consumers and pros have distinct login/signup flows backed by Firebase Auth + Firestore role documents
- **Real-time sync** — Firestore listeners keep booking state in sync across both devices instantly
