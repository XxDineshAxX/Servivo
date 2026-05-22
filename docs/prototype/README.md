# Servivo — prototype

On-demand home services. A consumer books the nearest pro who can arrive within
the hour; the pro accepts or declines in real time.

This is a **working, clickable prototype** in a single file:
`servivo-prototype.html`. It runs by double-clicking — no install, no accounts,
no API keys. Every production service is simulated behind a thin abstraction so
the real implementation can be dropped in later.

## Run it

Double-click `servivo-prototype.html` (or open it in any modern browser).

It is two-sided, so play both roles one of two ways:

- **Two windows (best).** Open the file in two browser windows. Pick *I need a
  service* in one and *I'm a pro* in the other. A booking made in one window
  appears live in the other.
- **One window.** Book as a customer, then tap the **⇄** button to switch to
  the pro side. Sign in as the pro showing a ⚡ badge, accept the job, then
  switch back to watch them arrive.

The **?** button in the app shows this guide and a *Reset demo data* button.

## What the demo shows

A customer signs in, picks a service (e.g. Plumbing), and sees pros on a map of
Dallas–Fort Worth. The app filters to pros who are online and have a clear
calendar for the next 60 minutes, then sorts them by true distance. The customer
requests the nearest one; that pro gets a notification and accepts or declines.
On accept, the pro's marker glides toward the customer with a live ETA. On
decline, the customer is offered the next-nearest pro.

## How the five production requirements map in

The prototype already contains the real logic for scheduling and distance; the
other four pieces are simulated and isolated for a clean swap. All switches live
in the `CONFIG` block at the top of the script.

| Requirement | In the prototype | To go live |
|---|---|---|
| **Real map** | Built-in fallback map (DFW street grid) | Paste a token into `CONFIG.MAPBOX_TOKEN` — the app auto-switches to live Mapbox GL tiles. `MapService` already renders markers and routes through Mapbox. |
| **Real-time backend** | `RealtimeService` syncs devices via the browser `BroadcastChannel` + `localStorage` | Replace its `commit` / `bookings` / subscribe internals with Firebase Realtime Database (`ref`, `onValue`, `update`). Booking objects are already plain JSON. |
| **Auth** | `AuthService` — separate consumer (name) and pro (profile pick) flows | Replace with Firebase Auth: phone/email provider for consumers, a pro provider + `pros` collection for pros. |
| **Push notifications** | `NotificationService` uses the Web Notifications API + in-app toasts | Swap for Firebase Cloud Messaging (FCM) so pros are alerted even with the app closed. |
| **Scheduling logic** | `Scheduling.rankPros()` — production logic. Filters pros free for the next 60 min from their calendar, sorts by the **Haversine** formula | Point `PROS` and the calendar lookup at your Firestore query; the filter + sort are already correct. |

## Core logic worth reviewing

- `haversine(lat1,lon1,lat2,lon2)` — great-circle distance in km.
- `Scheduling.freeNextHour(pro)` — true only if no calendar block overlaps the
  next 60 minutes.
- `Scheduling.rankPros(category, location)` — available pros first, then sorted
  nearest-first.

## Architecture notes (web now, mobile later)

The booking state machine, scheduling engine, Haversine math, and the four
service abstractions are plain, framework-free JavaScript. When you build the
mobile app, that logic and the shared Firebase backend carry over directly — only
the UI layer (the `view*` render functions) is web-specific.

Booking lifecycle: `requested → enroute → arrived → completed`, or `rejected`
/ `cancelled`.
