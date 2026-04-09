# onMyWay

[![WIP](https://img.shields.io/badge/status-WIP-yellow?style=flat-square)](https://github.com/MarcosMatsuda/onMyWay)
[![Phase](https://img.shields.io/badge/phase-3%20Web-blue?style=flat-square)](https://github.com/MarcosMatsuda/onMyWay/blob/develop/IMPLEMENTATION-ROADMAP.md)
[![Backend](https://img.shields.io/badge/backend-complete-brightgreen?style=flat-square)](#)
[![Mobile](https://img.shields.io/badge/mobile-in%20progress-orange?style=flat-square)](#)
[![Web](https://img.shields.io/badge/web-in%20progress-orange?style=flat-square)](#)

Real-time arrival notification system with live queue management.

> **🚧 Work In Progress** — Backend complete. Mobile and Web Dashboard in active development. See [IMPLEMENTATION-ROADMAP.md](./IMPLEMENTATION-ROADMAP.md) for timeline.

## 📊 Status

| Layer | Status | Notes |
|-------|--------|-------|
| ✅ Backend (NestJS) | Complete | Auth, locations, schools, WebSocket, OSRM, PostGIS, admin roles |
| 🔄 Mobile (Expo) | In Progress | All screens built, API integration in progress |
| 🔄 Web Dashboard (Next.js) | In Progress | Admin panel and school dashboard built, real-time integration in progress |

## 📚 Documentation

- [BRAINSTORM.md](./BRAINSTORM.md) — Product vision, stack, and OSRM strategy
- [TECHNICAL-ARCHITECTURE.md](./TECHNICAL-ARCHITECTURE.md) — Complete technical analysis
- [IMPLEMENTATION-ROADMAP.md](./IMPLEMENTATION-ROADMAP.md) — Development phases and timeline

## 📂 Project Structure

```
onMyWay/
├── backend/        # Node.js + NestJS API (complete)
├── mobile/         # React Native + Expo (active)
├── web/            # Next.js + React Dashboard (active)
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

# Web Dashboard
cd web
npm install
npm run dev            # http://localhost:3004
```

---

**Built with Clean Architecture principles. Inspired by modern SaaS patterns.**
