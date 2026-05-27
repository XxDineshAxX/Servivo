# Servivo — Setup Guide

## Prerequisites

- Node.js ≥ 18
- npm ≥ 10
- Expo CLI: `npm install -g expo-cli`
- Firebase CLI: `npm install -g firebase-tools`
- A [Firebase project](https://console.firebase.google.com) with Firestore, Auth, and FCM enabled
- A [Mapbox account](https://account.mapbox.com) with a public token

---

## 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → New Project
2. Enable **Authentication** → Email/Password
3. Enable **Firestore** (Production mode — rules are deployed below)
4. Enable **Cloud Messaging** (for push notifications)
5. In Project Settings → General, copy your Web App config values

## 2. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in `.env` with your Firebase credentials and Mapbox token.

## 3. Install Dependencies

```bash
npm install
```

## 4. Deploy Firebase Rules & Indexes

```bash
cd infra/firebase
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules,firestore:indexes
```

## 5. Deploy Cloud Functions (Push Notifications)

```bash
cd infra/firebase
firebase deploy --only functions
```

## 6. Run the Web App

```bash
npm run web
# Opens at http://localhost:3000
```

## 7. Run the Mobile App (Expo)

```bash
npm run mobile
# Scan the QR code with Expo Go (iOS/Android)
```

For push notifications on mobile, you need a physical device and a development build:

```bash
cd apps/mobile
npx expo run:ios      # or run:android
```

---

## Firestore Data Model

| Collection | Document | Description |
|---|---|---|
| `users` | `{uid}` | Consumer or Pro profile |
| `bookings` | `{bookingId}` | Booking record with status |
| `availability` | `{slotId}` | Pro availability time windows |

## Adding Availability Slots (Pro)

Pros add slots via the **Schedule** screen. Each slot has:

- `proId` — the pro's Firebase UID
- `startAt` — slot start (Unix ms)
- `endAt` — slot end (Unix ms)

The scheduling engine queries for slots where `endAt >= now` and filters to those starting within 60 minutes, then sorts results by Haversine distance.

## Key API Keys to Collect

| Key | Where |
|---|---|
| Firebase Web API Key | Firebase Console → Project Settings → Your Apps |
| Firebase Auth Domain | Same |
| Firebase Project ID | Same |
| Firebase Messaging Sender ID | Same |
| Firebase VAPID Key | Project Settings → Cloud Messaging → Web Push certificates |
| Mapbox Public Token | [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens) |
