# Servivo

> On-demand service booking — connect with the nearest available professional in under an hour.

[![CI](https://github.com/your-org/servivo/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/servivo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## What is Servivo?

Servivo is a mobile-first marketplace that lets consumers instantly book a nearby professional (plumber, electrician, cleaner, etc.) who can arrive within the next hour. Pros receive real-time booking requests and can accept or reject them directly from the app, with live location tracking visible to the consumer throughout.

---

## Monorepo Structure

```
servivo/
├── apps/
│   ├── mobile/          # React Native (iOS + Android) — consumer & pro app
│   └── web-admin/       # Vite + React — internal admin dashboard
├── backend/             # Node.js + Express + Prisma — REST API & WebSocket server
├── packages/
│   ├── shared-types/    # TypeScript types shared across all apps
│   ├── api-client/      # Typed HTTP client for the backend API
│   └── utils/           # Shared utility functions (geo, time, formatters)
├── infra/               # Terraform (AWS) + Kubernetes manifests
└── docs/                # Architecture, API reference, guides
```

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Mobile       | React Native, Expo, Redux Toolkit, React Query  |
| Maps         | React Native Maps (Google Maps / Apple Maps)    |
| Backend      | Node.js, Express, TypeScript, Prisma ORM        |
| Database     | PostgreSQL (with PostGIS for geo queries)        |
| Cache / PubSub | Redis                                         |
| Real-time    | Socket.IO (WebSockets)                          |
| Auth         | JWT + Refresh Tokens                            |
| Notifications| Firebase Cloud Messaging (FCM)                  |
| Payments     | Stripe                                          |
| Infra        | AWS (ECS Fargate, RDS, ElastiCache), Terraform  |
| CI/CD        | GitHub Actions                                  |

---

## Getting Started

See [docs/guides/getting-started.md](./docs/guides/getting-started.md) for full setup instructions.

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)

### Quick Start

```bash
# Clone the repo
git clone https://github.com/your-org/servivo.git
cd servivo

# Install all dependencies
pnpm install

# Copy and fill in environment variables
cp .env.example .env
cp backend/.env.example backend/.env
cp apps/mobile/.env.example apps/mobile/.env

# Start backend services (Postgres, Redis) via Docker
docker compose up -d

# Run database migrations and seed
pnpm --filter backend db:migrate
pnpm --filter backend db:seed

# Start all apps in dev mode
pnpm dev
```

---

## Key Features

- **Instant matching** — geo-proximity algorithm finds the nearest available pro within 1 hour
- **Live map tracking** — consumer sees pro's real-time location after booking is accepted
- **Accept / Reject flow** — pro receives push notification and can act within 60 seconds
- **Dual-role app** — single app supports both consumer and pro personas
- **Rating & reviews** — post-booking review system for both parties
- **Stripe payments** — secure card-on-file charging after service completion

---

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a PR.

---

## License

[MIT](./LICENSE)
