# onMyWay

[![WIP](https://img.shields.io/badge/status-WIP-yellow?style=flat-square)](https://github.com/MarcosMatsuda/onMyWay)
[![Phase](https://img.shields.io/badge/phase-0%20Setup-blue?style=flat-square)](https://github.com/MarcosMatsuda/onMyWay/blob/develop/IMPLEMENTATION-ROADMAP.md)

Real-time arrival notification system with live queue management.

> **🚧 Work In Progress** — Currently in Phase 0 (Project Setup). See [IMPLEMENTATION-ROADMAP.md](./IMPLEMENTATION-ROADMAP.md) for timeline.

  ## 📚 Documentation

  - [BRAINSTORM.md](./BRAINSTORM.md) — Product vision, stack, and OSRM strategy
  - [TECHNICAL-ARCHITECTURE.md](./TECHNICAL-ARCHITECTURE.md) — Complete technical analysis
  - [IMPLEMENTATION-ROADMAP.md](./IMPLEMENTATION-ROADMAP.md) — Development phases and timeline

  ## 📂 Project Structure

  onMyWay/
  ├── backend/        (Node.js + Nest.js API)
  ├── mobile/         (React Native + Expo)
  ├── web/            (Next.js + React Dashboard)
  └── docs/           (Documentation)

  ## 🎯 MVP Overview

  - **Mobile App:** Parents share location with privacy controls (only tracked within 1km of destination)
  - **Backend:** Real-time location processing, OSRM route calculation, WebSocket updates
  - **Web Dashboard:** Live arrival queue with interactive map and ETA tracking

  ## 🔧 Tech Stack

  | Layer | Technology |
  |-------|-----------|
  | Mobile | React Native + Expo |
  | Backend | Node.js + Nest.js + TypeScript |
  | Database | PostgreSQL + PostGIS |
  | Routing | OSRM (Open Source Routing Machine) |
  | Real-time | WebSocket (Socket.io) |
  | Web | Next.js + React + Tailwind |
  | Hosting | Railway (backend) + Vercel (web) |

  ## 📅 Development

  See [IMPLEMENTATION-ROADMAP.md](./IMPLEMENTATION-ROADMAP.md) for detailed phases and timeline.

  **Status:** 🚧 Phase 0 - Project setup

  ---

  **Built with Clean Architecture principles. Inspired by modern SaaS patterns.**
