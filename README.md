# onMyWay

[![WIP](https://img.shields.io/badge/status-WIP-yellow?style=flat-square)](https://github.com/MarcosMatsuda/onMyWay)
[![Phase](https://img.shields.io/badge/phase-0%20Setup-blue?style=flat-square)](https://github.com/MarcosMatsuda/onMyWay/blob/develop/IMPLEMENTATION-ROADMAP.md)

Real-time arrival notification system with live queue management.

> **🚧 Work In Progress** — Currently in Phase 0 (Project Setup). See [IMPLEMENTATION-ROADMAP.md](./IMPLEMENTATION-ROADMAP.md) for timeline.

Real-time arrival notification system with live queue management.

> **🚧 Work In Progress** — Backend complete. Mobile app in active development. See [IMPLEMENTATION-ROADMAP.md](./IMPLEMENTATION-ROADMAP.md) for timeline.

## 📊 Status

| Layer | Status | Notes |
|-------|--------|-------|
| ✅ Backend (NestJS) | Complete | Auth, locations, schools, WebSocket, OSRM, PostGIS |
| 🔄 Mobile (Expo) | In Progress | All screens built, API integration in progress |
| ⏳ Web Dashboard | Planned | Phase 3 |

## 📚 Documentation

- [BRAINSTORM.md](./BRAINSTORM.md) — Product vision, stack, and OSRM strategy
- [TECHNICAL-ARCHITECTURE.md](./TECHNICAL-ARCHITECTURE.md) — Complete technical analysis
- [IMPLEMENTATION-ROADMAP.md](./IMPLEMENTATION-ROADMAP.md) — Development phases and timeline

## 📂 Project Structure

```
onMyWay/
├── backend/        # Node.js + NestJS API (active)
├── mobile/         # React Native + Expo (active)
├── web/            # Next.js + React Dashboard (planned)
└── docs/           # Documentation
```

## 🎯 MVP Overview

- **Mobile App:** Parents share location with privacy controls (only tracked within 1km of destination)
- **Backend:** Real-time location processing, OSRM route calculation, WebSocket updates
- **Web Dashboard:** Live arrival queue with interactive map and ETA tracking

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo |
| Backend | Node.js + NestJS + TypeScript |
| Database | PostgreSQL + PostGIS |
| Routing | OSRM (Open Source Routing Machine) |
| Real-time | WebSocket (Socket.io) |
| Notifications | Firebase Cloud Messaging (FCM) |
| Web | Next.js + React + Tailwind |
| Hosting | Railway (backend) + Vercel (web) |

## 🚀 Running Locally

```bash
# Backend
cd backend
docker-compose up -d   # PostgreSQL + PostGIS
npm install
npm run start:dev      # http://localhost:3000

# Mobile
cd mobile
npm install
npx expo start
```

---

**Built with Clean Architecture principles. Inspired by modern SaaS patterns.**
