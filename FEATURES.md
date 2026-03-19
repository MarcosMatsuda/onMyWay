# onMyWay — Feature Tasks for PM Agent

> Each task is designed for the Developer agent:
> - Max 4 files per task
> - ~200 lines of diff
> - Has clear Definition of Done (DoD)
> - Testable by Tester agent

---

## Phase 1: Backend Setup

---

### TASK-001: Nest.js project initialization

**Files:**
1. `backend/package.json`
2. `backend/tsconfig.json`
3. `backend/nest-cli.json`
4. `backend/src/main.ts`

**What to do:**
- Initialize Nest.js project with TypeScript
- Configure port 3000 from `process.env.PORT`
- Enable global validation pipe (`class-validator`)
- Add CORS enabled for all origins (development)

**DoD:**
- `npm run start:dev` starts without errors on port 3000
- `GET /` returns 200

---

### TASK-002: App module + ESLint

**Files:**
1. `backend/src/app.module.ts`
2. `backend/.eslintrc.js`
3. `backend/.prettierrc`
4. `backend/src/app.controller.ts`

**What to do:**
- AppModule imports all feature modules (placeholder for now)
- ESLint configured for TypeScript + Nest.js
- Prettier configured (singleQuote, trailingComma: 'all')
- Health check endpoint: `GET /` returns `{ status: 'ok', service: 'onMyWay API' }`

**DoD:**
- `npm run lint` passes with 0 errors
- `npx tsc --noEmit` passes
- `GET /` returns `{ status: 'ok', service: 'onMyWay API' }`

---

### TASK-003: Domain entities

**Files:**
1. `backend/src/domain/entities/parent.entity.ts`
2. `backend/src/domain/entities/school.entity.ts`
3. `backend/src/domain/entities/location.entity.ts`
4. `backend/src/domain/entities/eta.entity.ts`

**What to do:**
- Create TypeScript interfaces for all 4 entities (no class decorators yet — pure domain)
- See `BACKEND.md` for field definitions
- Export all from `backend/src/domain/entities/index.ts`

**DoD:**
- `npx tsc --noEmit` passes
- Each entity has all fields from `BACKEND.md`

---

### TASK-004: Repository interfaces

**Files:**
1. `backend/src/domain/repositories/parent.repository.interface.ts`
2. `backend/src/domain/repositories/school.repository.interface.ts`
3. `backend/src/domain/repositories/location.repository.interface.ts`
4. `backend/src/domain/repositories/eta.repository.interface.ts`

**What to do:**
- Create TypeScript interfaces for all 4 repositories
- See `BACKEND.md` for method signatures
- Export all from `backend/src/domain/repositories/index.ts`

**DoD:**
- `npx tsc --noEmit` passes
- Each interface has all methods from `BACKEND.md`

---

### TASK-005: Database module (TypeORM + PostGIS)

**Files:**
1. `backend/src/infrastructure/database/database.module.ts`
2. `backend/docker-compose.yml`
3. `backend/.env.example`
4. `backend/src/infrastructure/database/typeorm.config.ts`

**What to do:**
- `docker-compose.yml`: PostgreSQL + PostGIS (image: `postgis/postgis:15-3.3`) + Redis
- TypeORM config reads `DATABASE_URL` from env
- DatabaseModule is a NestJS module that provides TypeORM connection
- `.env.example` with all variables from `BACKEND.md`

**DoD:**
- `docker-compose up` starts PostgreSQL + Redis without errors
- TypeORM connects to PostgreSQL when app starts
- No TypeScript errors

---

### TASK-006: Database models (TypeORM entities)

**Files:**
1. `backend/src/data/models/parent.model.ts`
2. `backend/src/data/models/school.model.ts`
3. `backend/src/data/models/location.model.ts`
4. `backend/src/data/models/eta.model.ts`

**What to do:**
- TypeORM `@Entity()` classes for all 4 models
- Use schema from `BACKEND.md` (SQL section)
- `School` and `Location` models include PostGIS `geography` column
- All models use UUID primary keys

**DoD:**
- `npx tsc --noEmit` passes
- TypeORM `synchronize: true` creates tables in dev (check with `\dt` in psql)

---

### TASK-007: Auth module (register + login)

**Files:**
1. `backend/src/presentation/auth/auth.controller.ts`
2. `backend/src/presentation/auth/auth.service.ts`
3. `backend/src/presentation/auth/auth.module.ts`
4. `backend/src/presentation/auth/dtos/register.dto.ts`

**What to do:**
- `POST /auth/register`: create parent with hashed password (bcrypt)
- `POST /auth/login`: validate credentials, return JWT token
- `GET /auth/profile`: returns authenticated parent (JWT guard)
- DTOs with `class-validator` decorators

**DoD:**
- `POST /auth/register` creates parent, returns `{ token, parent }`
- `POST /auth/login` with valid credentials returns `{ token, parent }`
- `POST /auth/login` with wrong password returns 401
- `GET /auth/profile` with valid token returns parent data
- `GET /auth/profile` without token returns 401

---

### TASK-008: Parent repository implementation

**Files:**
1. `backend/src/data/repositories/parent.repository.ts`
2. `backend/src/data/mappers/parent.mapper.ts`
3. `backend/src/data/repositories/school.repository.ts`
4. `backend/src/data/mappers/school.mapper.ts`

**What to do:**
- Implement `IParentRepository` and `ISchoolRepository` using TypeORM
- Mappers convert between TypeORM models and domain entities
- Register in NestJS DI with injection tokens

**DoD:**
- `npx tsc --noEmit` passes
- Unit tests: `findById` returns null for non-existent ID, returns entity for existing ID
- Unit tests: `create` persists and returns new entity

---

### TASK-009: OSRM service

**Files:**
1. `backend/src/infrastructure/osrm/osrm.service.ts`
2. `backend/src/infrastructure/osrm/osrm.module.ts`
3. `backend/src/infrastructure/osrm/osrm.types.ts`

**What to do:**
- `calculateRoute(fromLat, fromLng, toLat, toLng)` calls OSRM API
- Uses `OSRM_BASE_URL` from env (default: `http://router.project-osrm.org`)
- Returns `{ distanceMeters, durationSeconds, polyline }`
- Handle OSRM errors gracefully (throw custom `OSRMUnavailableError`)

**DoD:**
- Unit test: mock HTTP call, assert correct parsing of OSRM response
- Unit test: when OSRM returns error, `OSRMUnavailableError` is thrown
- `npx tsc --noEmit` passes

---

### TASK-010: PostGIS geofence service

**Files:**
1. `backend/src/infrastructure/postgis/geofence.service.ts`
2. `backend/src/infrastructure/postgis/geofence.module.ts`

**What to do:**
- `isWithinGeofence(parentLat, parentLng, schoolLat, schoolLng, radiusMeters): Promise<boolean>`
- Uses PostGIS `ST_Distance` with `geography` type (returns meters)
- Uses raw TypeORM query

**DoD:**
- Integration test: insert school at fixed coords, check parent at 500m is within 1000m radius
- Integration test: parent at 2000m is NOT within 1000m radius
- `npx tsc --noEmit` passes

---

### TASK-011: Location + ETA repositories

**Files:**
1. `backend/src/data/repositories/location.repository.ts`
2. `backend/src/data/mappers/location.mapper.ts`
3. `backend/src/data/repositories/eta.repository.ts`
4. `backend/src/data/mappers/eta.mapper.ts`

**What to do:**
- Implement `ILocationRepository` and `IETARepository`
- `findParentsNearSchool` uses PostGIS `ST_Distance` query
- `findBySchoolId` returns ETAs sorted by `duration_seconds ASC`

**DoD:**
- `npx tsc --noEmit` passes
- Unit tests for mappers (model → entity, entity → model)

---

### TASK-012: SaveLocation + CalculateETA use cases

**Files:**
1. `backend/src/domain/use-cases/save-location.use-case.ts`
2. `backend/src/domain/use-cases/calculate-eta.use-case.ts`

**What to do:**
- `SaveLocationUseCase`: save location → check geofence → if inside, call `CalculateETAUseCase`
- `CalculateETAUseCase`: call OSRM → save ETA → call `NotifySchoolUseCase`
- Both use constructor injection of repository interfaces and services

**DoD:**
- Unit test: `SaveLocationUseCase` — parent outside geofence: `CalculateETA` NOT called
- Unit test: `SaveLocationUseCase` — parent inside geofence: `CalculateETA` IS called
- Unit test: `CalculateETAUseCase` — saves ETA and calls notify
- `npx tsc --noEmit` passes

---

### TASK-013: GetArrivalsQueue + NotifySchool use cases

**Files:**
1. `backend/src/domain/use-cases/get-arrivals-queue.use-case.ts`
2. `backend/src/domain/use-cases/notify-school.use-case.ts`

**What to do:**
- `GetArrivalsQueueUseCase`: fetch latest ETAs for school, join with parent names, sort by duration ASC
- `NotifySchoolUseCase`: emit `arrivals:updated` event to WebSocket room `school:{schoolId}`

**DoD:**
- Unit test: `GetArrivalsQueue` returns sorted list (closest first)
- Unit test: `NotifySchool` emits to correct WebSocket room
- `npx tsc --noEmit` passes

---

### TASK-014: WebSocket gateway

**Files:**
1. `backend/src/infrastructure/websocket/arrivals.gateway.ts`
2. `backend/src/infrastructure/websocket/websocket.module.ts`

**What to do:**
- Nest.js WebSocket gateway using Socket.io
- Clients send `joinSchool` event with `{ schoolId }` → join room `school:{schoolId}`
- Clients send `leaveSchool` event → leave room
- Gateway exposes `emitArrivalsUpdated(schoolId, payload)` method for use cases to call

**DoD:**
- Connect to `ws://localhost:3000` with Socket.io client
- Emit `joinSchool` with `{ schoolId: 'test-id' }` — no errors
- When `emitArrivalsUpdated` is called, clients in the room receive the event

---

### TASK-015: Locations controller

**Files:**
1. `backend/src/presentation/locations/locations.controller.ts`
2. `backend/src/presentation/locations/locations.module.ts`
3. `backend/src/presentation/locations/dtos/save-location.dto.ts`

**What to do:**
- `POST /locations`: receives `{ lat, lng, accuracy }`, calls `SaveLocationUseCase`
- `GET /locations/me`: returns latest location for authenticated parent
- JWT guard on both endpoints
- Returns `{ saved: true, withinGeofence: boolean, eta?: ETA }`

**DoD:**
- `POST /locations` without JWT returns 401
- `POST /locations` with valid JWT and `{ lat: -23.5, lng: -46.6, accuracy: 10 }` returns `{ saved: true, withinGeofence: boolean }`
- Controller test with mocked use case passes

---

### TASK-016: Schools controller

**Files:**
1. `backend/src/presentation/schools/schools.controller.ts`
2. `backend/src/presentation/schools/schools.module.ts`
3. `backend/src/presentation/schools/dtos/school-config.dto.ts`

**What to do:**
- `GET /schools/:id/arrivals`: calls `GetArrivalsQueueUseCase`, returns sorted queue
- `GET /schools/:id/stats`: returns `{ totalParents, arrivingCount, avgETA }`
- `POST /schools/:id/config`: updates school geofence/notification config
- JWT guard on all endpoints

**DoD:**
- `GET /schools/:id/arrivals` returns array sorted by `durationSeconds` ASC
- `GET /schools/:id/arrivals` without JWT returns 401
- `POST /schools/:id/config` updates and returns updated school
- Controller tests pass

---

### TASK-017: Unit tests — use cases

**Files:**
1. `backend/src/domain/use-cases/__tests__/save-location.use-case.spec.ts`
2. `backend/src/domain/use-cases/__tests__/calculate-eta.use-case.spec.ts`
3. `backend/src/domain/use-cases/__tests__/get-arrivals-queue.use-case.spec.ts`
4. `backend/src/domain/use-cases/__tests__/notify-school.use-case.spec.ts`

**What to do:**
- Full test coverage for all 4 use cases
- Mock all external dependencies (repositories, OSRM, WebSocket)
- Test both happy path and error cases

**DoD:**
- `npm test` passes
- Coverage >= 80% for use-cases folder

---

## Phase 2: Mobile App (Expo)

_(Tasks to be defined after Phase 1 is complete)_

---

## Phase 3: Web Dashboard

_(Tasks to be defined after Phase 1 is complete)_
