# Getting Started with Servivo

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 |
| Docker | latest |
| Expo CLI | latest |
| iOS Simulator / Android Emulator | — |

## 1 — Clone & Install

```bash
git clone https://github.com/your-org/servivo.git
cd servivo
pnpm install
```

## 2 — Environment Variables

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Fill in the required values in each `.env` file. The minimum to get started locally:
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET` and `JWT_REFRESH_SECRET`

## 3 — Start Infrastructure

```bash
docker compose up -d
# Starts: PostgreSQL on :5432, Redis on :6379
```

## 4 — Database Setup

```bash
pnpm --filter backend db:migrate   # Run Prisma migrations
pnpm --filter backend db:seed      # Seed with sample data
```

## 5 — Start Development Servers

```bash
pnpm dev
# Starts:
#   backend    → http://localhost:4000
#   web-admin  → http://localhost:3001
#   mobile     → Expo dev server (scan QR with Expo Go)
```

## Project Conventions

- **Branches**: `feature/*`, `fix/*`, `chore/*` → PR into `develop` → merge to `main`
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) format
- **PRs**: Require at least 1 review + passing CI
