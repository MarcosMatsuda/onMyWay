# onMyWay

SaaS de notificações em tempo real de chegada de pais em escolas. Geolocalização, WebSocket, fila ao vivo com ETA calculada por rota real (OSRM).

**Status:** Fase 1 — Backend em desenvolvimento. Mobile e Web ainda não iniciados.

## Monorepo

```
onMyWay/
├── backend/     # Node.js + NestJS (ativo)
├── mobile/      # React Native + Expo (futuro)
├── web/         # Next.js + TailwindCSS (futuro)
└── docs/        # Documentação de referência
```

## Documentação de Referência

- `TECHNICAL-ARCHITECTURE.md` — Arquitetura completa do sistema (1965 linhas)
- `IMPLEMENTATION-ROADMAP.md` — Fases de desenvolvimento e timeline
- `BACKEND.md` — Especificação técnica do backend (entities, repos, use cases, endpoints)
- `FEATURES.md` — Tasks granulares para o developer agent
- `BRAINSTORM.md` — Visão de produto e análise de mercado

**Ler esses docs antes de implementar qualquer feature.**

---

## Backend (`backend/`)

### Stack

- **NestJS** 11 + **TypeScript** 5
- **TypeORM** 0.3 + **PostgreSQL** + **PostGIS**
- **Socket.io** 4 (WebSocket para real-time)
- **Passport** + **JWT** para autenticação
- **Axios** para chamadas HTTP (OSRM)
- **class-validator** + **class-transformer** para validação
- **bcrypt** para hash de senhas
- **Node.js** 20 LTS

### Arquitetura — Clean Architecture

```
backend/src/
├── domain/           # Entidades puras e interfaces
│   ├── entities/     # Parent, School, Location, ETA
│   └── repositories/ # Interfaces: IParentRepository, ISchoolRepository, etc.
├── data/             # Implementações de repositório, models, mappers
│   ├── models/
│   ├── repositories/
│   └── mappers/
├── infrastructure/   # Integrações externas
│   ├── osrm/         # OSRM service (cálculo de rota/ETA)
│   ├── postgis/      # Geofence service (ST_Distance, ST_DWithin)
│   ├── websocket/    # Arrivals gateway (Socket.io)
│   └── database/     # Database module (TypeORM)
├── presentation/     # Controllers e modules NestJS
│   ├── auth/         # POST /auth/register, /auth/login, GET /auth/profile
│   ├── locations/    # POST /locations, GET /locations/me
│   └── schools/      # GET /schools/:id/arrivals, /schools/:id/stats
├── app.module.ts     # Root module
├── app.controller.ts # Health check
└── main.ts           # Bootstrap (porta 3000)
```

### Regras de dependência

- **Domain** → não importa de nenhuma outra camada (TypeScript puro)
- **Data** → implementa interfaces do Domain, usa Infrastructure
- **Infrastructure** → adapters para libs externas (TypeORM, Socket.io, Axios, PostGIS)
- **Presentation** → controllers NestJS, usam Use Cases do Domain

### Path Aliases

```
@domain/*        → src/domain/*
@data/*          → src/data/*
@infrastructure/* → src/infrastructure/*
@presentation/*  → src/presentation/*
```

### Entidades do Domain

- **Parent** — id, name, email, phone
- **School** — id, name, location (lat/lng), config
- **Location** — parentId, lat, lng, timestamp, accuracy
- **ETA** — parentId, distanceMeters, durationMinutes, routePolyline

### Use Cases

- `SaveLocationUseCase` — salva localização do pai
- `CalculateETAUseCase` — calcula ETA via OSRM
- `GetArrivalsQueueUseCase` — fila ordenada por ETA
- `NotifySchoolUseCase` — notifica escola via WebSocket + FCM

### Geofencing State Machine

```
IDLE (distance > 1000m)
  ↓ (distance ≤ 500m por 20+ seg)
APPROACHING (notificação enviada)
  ↓ (distance ≤ 100m por 10+ seg)
ARRIVED (notificação final)
  ↓ (distance > 500m por 30+ seg)
IDLE (reset)
```

### Comandos

```bash
cd backend
npm run start:dev     # Dev server (watch mode, porta 3000)
npm run build         # Build
npm run lint          # ESLint (0 warnings max)
npm test              # Jest (--passWithNoTests)
npm run test:cov      # Coverage
npx tsc --noEmit      # Type check
```

### Docker (PostgreSQL + PostGIS)

```bash
cd backend
docker-compose up -d  # Sobe PostgreSQL + PostGIS
```

### Testes

- Jest + ts-jest, environment node
- Pattern: `*.spec.ts`
- `@nestjs/testing` para testes de módulos

---

## Mobile (futuro — `mobile/`)

### Stack planejada
- React Native + Expo (managed workflow)
- react-native-geolocation-service (background location)
- socket.io-client (WebSocket)
- react-query (data fetching)
- Firebase Messaging (push notifications)

---

## Web Dashboard (futuro — `web/`)

### Stack planejada
- Next.js 14 + TailwindCSS
- socket.io-client (real-time)
- next-auth / Clerk (auth)
- recharts (analytics)

---

## Convenções Gerais

### Commits
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- Mensagens em inglês
- **Nunca mencionar IA, Claude ou ferramentas automatizadas** em commits ou PRs
- PRs devem referenciar issues: `Closes #N`

### Branches
- `main` — produção
- `develop` — desenvolvimento
- Feature: `feat/nome`
- Fix: `fix/nome`

### Linting (Backend)
- ESLint + Prettier
- `singleQuote: true`, `trailingComma: 'all'`
- `--max-warnings 0`

## Conformidade

- **LGPD nativa** — localização é dado sensível
- Retenção: 30 dias (location), 90 dias (audit), 60 dias (notifications)
- Criptografia em trânsito (HTTPS + WSS)
- Row-Level Security por school_id (multi-tenant)
- Privacy: localização só rastreada dentro de 1km do destino
