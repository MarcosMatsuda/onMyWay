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
npm run start:dev       # Dev server (watch mode, porta 3000)
npm run build           # Build + TypeScript check (nest build)
npm run lint            # ESLint (0 warnings max)
npm test                # Jest unit tests only (default for WIP)
npm run test:unit       # Explicit unit tests
npm run test:coverage   # Unit tests + coverage report
npm run test:integration # Integration tests (requires PostgreSQL)
npm run test:all        # Both unit + integration
npm run test:watch      # Unit tests in watch mode
```

### Docker (PostgreSQL + PostGIS)

```bash
cd backend
docker-compose up -d  # Sobe PostgreSQL + PostGIS
```

### Testes

**Multi-project Jest setup:**
- **Unit tests** (`*.spec.ts` — excludes `*.integration.spec.ts`)
  - Rodam sem dependências externas (mocks de HTTP, DB)
  - Padrão: unit tests para use cases, services, controllers
  - Rápido (~6s)
- **Integration tests** (`*.integration.spec.ts`)
  - Requerem PostgreSQL + PostGIS
  - Atualmente: apenas testes de database module
  - Não rodam em WIP

**Configuração:**
- Jest config: `jest.config.js` (multi-project)
- Setup global: `jest.setup.ts` (clearAllMocks beforeEach)
- Path aliases mapeados: `@domain/*`, `@data/*`, `@infrastructure/*`, `@presentation/*`
- Mocks: `src/__mocks__/axios.ts` (HTTP calls)

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

### Ciclo de vida das Issues

**Ao abrir um PR:**
- Sempre incluir `Closes #N` no corpo do PR para que o GitHub feche a issue automaticamente no merge

**Ao encontrar um problema numa issue já implementada:**
1. **Fechar a issue original** — com comentário explicando que a implementação foi entregue
2. **Abrir nova issue** — descrevendo especificamente o problema encontrado, com contexto, escopo e critérios de aceite próprios
3. Nunca reaproveitar uma issue fechada para rastrear problemas novos

**Nunca deixar issue aberta se a implementação já foi entregue** — mesmo que com imperfeições. O histórico deve refletir o que foi feito, e os problemas devem ter rastreabilidade própria.

### Branches
- `main` — produção
- `develop` — desenvolvimento
- Feature: `feat/nome`
- Fix: `fix/nome`

### Linting (Backend)
- ESLint + Prettier
- `singleQuote: true`, `trailingComma: 'all'`
- `--max-warnings 0`

## Pipeline de Qualidade

### Testes obrigatórios (antes de abrir PR)

- **Use cases** → unit tests (`.spec.ts`)
- **Repositories** → unit tests com mocks (`.spec.ts`)
- **Controllers** → unit tests com `@nestjs/testing` (`.spec.ts`)
- **Services** (OSRM, geofence) → unit tests com mocks
- Novos módulos **devem ter testes** antes de abrir PR
- E2E tests: não implementados por enquanto

### Checklist de PR (antes de abrir)

**Local verification (Developer WIP):**
1. ✅ `npm run lint` passa (0 warnings)
2. ✅ `npm run build` passa (TypeScript compile)
3. ✅ `npm test` passa (unit tests)

**Code review (após PR aberta):**
4. Segue Clean Architecture (ver seção Regras de dependência)
5. Domain não importa de outras camadas
6. DTOs com `class-validator` decorators para input validation
7. Testes cobrem happy path + edge cases
8. PR referencia issue: `Closes #N`

### CI automático (PRs para develop/main)

**Pipeline esperado:**
1. Security Audit (dependências vulneráveis)
2. Lint + TypeScript (paralelo)
3. Unit tests (não requer DB)

- Se qualquer step falhar → comenta no PR com link para logs
- Developer corrige e faz push novamente

### Labels de status

| Label | Significado |
|-------|-------------|
| `task` | Nova tarefa criada |
| `wip` | Trabalho em andamento |
| `needs-tests` | Precisa de testes antes de review |
| `needs-fix` | Bug ou correção necessária |
| `tests-ready` | Testes escritos e passando |
| `qa-approved` | QA aprovou — pronto para merge |
| `qa-changes-requested` | QA encontrou problemas — ver comentários |

### QA verifica

- Funcionalidade conforme a issue/task
- Edge cases (inputs inválidos, autenticação, permissões)
- Conformidade com Clean Architecture (sem violações de camada)
- Multi-tenant isolation (dados de School A não vazam para School B)
- Validação de DTOs (class-validator cobrindo todos os inputs)
- Segurança: JWT válido, bcrypt para senhas, sanitização de inputs
- Performance: queries PostGIS com índices GIST, sem N+1

## Conformidade

- **LGPD nativa** — localização é dado sensível
- Retenção: 30 dias (location), 90 dias (audit), 60 dias (notifications)
- Criptografia em trânsito (HTTPS + WSS)
- Row-Level Security por school_id (multi-tenant)
- Privacy: localização só rastreada dentro de 1km do destino
