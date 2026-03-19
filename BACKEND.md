# onMyWay — Backend Technical Specification

**Stack:** Node.js + Nest.js + TypeScript
**Architecture:** Clean Architecture (Domain → Data → Infrastructure → Presentation)
**Database:** PostgreSQL + PostGIS
**Real-time:** Socket.io
**Routing:** OSRM (Open Source Routing Machine)
**Cache:** Redis (optional, phase 2)

---

## Folder Structure

```
backend/
├── src/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── parent.entity.ts
│   │   │   ├── school.entity.ts
│   │   │   ├── location.entity.ts
│   │   │   └── eta.entity.ts
│   │   ├── repositories/
│   │   │   ├── parent.repository.interface.ts
│   │   │   ├── school.repository.interface.ts
│   │   │   ├── location.repository.interface.ts
│   │   │   └── eta.repository.interface.ts
│   │   └── use-cases/
│   │       ├── save-location.use-case.ts
│   │       ├── calculate-eta.use-case.ts
│   │       ├── get-arrivals-queue.use-case.ts
│   │       └── notify-school.use-case.ts
│   ├── data/
│   │   ├── models/
│   │   │   ├── parent.model.ts
│   │   │   ├── school.model.ts
│   │   │   ├── location.model.ts
│   │   │   └── eta.model.ts
│   │   ├── repositories/
│   │   │   ├── parent.repository.ts
│   │   │   ├── school.repository.ts
│   │   │   ├── location.repository.ts
│   │   │   └── eta.repository.ts
│   │   └── mappers/
│   │       ├── parent.mapper.ts
│   │       ├── school.mapper.ts
│   │       ├── location.mapper.ts
│   │       └── eta.mapper.ts
│   ├── infrastructure/
│   │   ├── osrm/
│   │   │   └── osrm.service.ts
│   │   ├── postgis/
│   │   │   └── geofence.service.ts
│   │   ├── websocket/
│   │   │   └── arrivals.gateway.ts
│   │   └── database/
│   │       └── database.module.ts
│   └── presentation/
│       ├── auth/
│       │   ├── auth.controller.ts
│       │   └── auth.module.ts
│       ├── locations/
│       │   ├── locations.controller.ts
│       │   └── locations.module.ts
│       └── schools/
│           ├── schools.controller.ts
│           └── schools.module.ts
├── docker-compose.yml
├── .env.example
├── package.json
├── tsconfig.json
└── nest-cli.json
```

---

## Domain Layer

### Entities

#### Parent
```typescript
export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  schoolId: string;
  createdAt: Date;
}
```

#### School
```typescript
export interface School {
  id: string;
  name: string;
  lat: number;
  lng: number;
  geofenceRadiusMeters: number; // default: 1000
  notificationThresholdMeters: number; // default: 500
  createdAt: Date;
}
```

#### Location
```typescript
export interface Location {
  id: string;
  parentId: string;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: Date;
}
```

#### ETA
```typescript
export interface ETA {
  id: string;
  parentId: string;
  schoolId: string;
  distanceMeters: number;
  durationSeconds: number;
  routePolyline: string; // encoded polyline from OSRM
  calculatedAt: Date;
}
```

---

### Repository Interfaces

#### IParentRepository
```typescript
export interface IParentRepository {
  findById(id: string): Promise<Parent | null>;
  findBySchoolId(schoolId: string): Promise<Parent[]>;
  create(data: Omit<Parent, 'id' | 'createdAt'>): Promise<Parent>;
  update(id: string, data: Partial<Parent>): Promise<Parent>;
}
```

#### ISchoolRepository
```typescript
export interface ISchoolRepository {
  findById(id: string): Promise<School | null>;
  create(data: Omit<School, 'id' | 'createdAt'>): Promise<School>;
  update(id: string, data: Partial<School>): Promise<School>;
}
```

#### ILocationRepository
```typescript
export interface ILocationRepository {
  save(location: Omit<Location, 'id'>): Promise<Location>;
  findLatestByParentId(parentId: string): Promise<Location | null>;
  findParentsNearSchool(schoolId: string, radiusMeters: number): Promise<string[]>; // parentIds
}
```

#### IETARepository
```typescript
export interface IETARepository {
  save(eta: Omit<ETA, 'id'>): Promise<ETA>;
  findLatestByParentId(parentId: string): Promise<ETA | null>;
  findBySchoolId(schoolId: string): Promise<ETA[]>; // sorted by duration ASC
}
```

---

### Use Cases

#### SaveLocationUseCase
**Input:** `{ parentId, lat, lng, accuracy }`
**Logic:**
1. Save location to DB
2. Calculate distance from parent to school (PostGIS `ST_Distance`)
3. If distance <= `school.geofenceRadiusMeters`: call `CalculateETAUseCase`
4. If distance > geofence: do nothing (privacy — parent not tracked)

#### CalculateETAUseCase
**Input:** `{ parentId, parentLat, parentLng, schoolLat, schoolLng }`
**Logic:**
1. Call OSRM: `GET /route/v1/driving/{parentLng},{parentLat};{schoolLng},{schoolLat}`
2. Parse response: `distance` (meters), `duration` (seconds), `geometry` (polyline)
3. Save ETA to DB
4. Call `NotifySchoolUseCase`

#### GetArrivalsQueueUseCase
**Input:** `{ schoolId }`
**Output:** List of parents with their latest ETA, sorted by `durationSeconds ASC`
```typescript
interface ArrivalItem {
  parentId: string;
  parentName: string;
  durationSeconds: number;
  distanceMeters: number;
  routePolyline: string;
  lastUpdatedAt: Date;
}
```

#### NotifySchoolUseCase
**Input:** `{ schoolId, parentId, eta: ETA }`
**Logic:**
1. Emit WebSocket event `arrivals:updated` to room `school:{schoolId}`
2. Payload: updated arrival queue (calls `GetArrivalsQueueUseCase`)

---

## Infrastructure Layer

### OSRM Service

Uses public OSRM server for MVP (`router.project-osrm.org`).

```typescript
// POST /locations triggers this
async calculateRoute(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<{ distanceMeters: number; durationSeconds: number; polyline: string }>
```

**OSRM API call:**
```
GET http://router.project-osrm.org/route/v1/driving/{fromLng},{fromLat};{toLng},{toLat}?overview=full&geometries=polyline
```

**Response parsing:**
- `routes[0].distance` → distanceMeters
- `routes[0].duration` → durationSeconds
- `routes[0].geometry` → encoded polyline

### PostGIS Geofence Service

```typescript
// Checks if parent is within radius of school
async isWithinGeofence(
  parentLat: number, parentLng: number,
  schoolLat: number, schoolLng: number,
  radiusMeters: number
): Promise<boolean>
```

**SQL query:**
```sql
SELECT ST_Distance(
  ST_MakePoint($1, $2)::geography,
  ST_MakePoint($3, $4)::geography
) <= $5 AS within_geofence
```

### WebSocket Gateway

Room naming: `school:{schoolId}`

**Events emitted to school room:**
- `arrivals:updated` — full updated queue payload

**Events clients can subscribe to:**
- `joinSchool` — join room `school:{schoolId}`
- `leaveSchool` — leave room

---

## Presentation Layer

### REST Endpoints

#### Auth
```
POST /auth/register
  Body: { name, email, password, phone, schoolId }
  Returns: { token, parent }

POST /auth/login
  Body: { email, password }
  Returns: { token, parent }

GET /auth/profile
  Headers: Authorization: Bearer {token}
  Returns: { parent }
```

#### Locations
```
POST /locations
  Headers: Authorization: Bearer {token}
  Body: { lat, lng, accuracy }
  Logic: SaveLocationUseCase (geofence check → ETA → notify)
  Returns: { saved: true, withinGeofence: boolean, eta?: ETA }

GET /locations/me
  Headers: Authorization: Bearer {token}
  Returns: { location: Location | null }
```

#### Schools
```
GET /schools/:id/arrivals
  Headers: Authorization: Bearer {token}
  Returns: { arrivals: ArrivalItem[] }  // sorted by ETA

GET /schools/:id/stats
  Headers: Authorization: Bearer {token}
  Returns: { totalParents: number, arrivingCount: number, avgETA: number }

POST /schools/:id/config
  Headers: Authorization: Bearer {token}
  Body: { geofenceRadiusMeters?, notificationThresholdMeters? }
  Returns: { school: School }
```

---

## Database Schema

### Tables (TypeORM / Prisma models)

```sql
-- parents
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  school_id UUID REFERENCES schools(id),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- schools
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(POINT, 4326),  -- PostGIS
  geofence_radius_meters INTEGER DEFAULT 1000,
  notification_threshold_meters INTEGER DEFAULT 500,
  created_at TIMESTAMP DEFAULT NOW()
);

-- locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  point GEOGRAPHY(POINT, 4326),  -- PostGIS
  accuracy FLOAT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- etas
CREATE TABLE etas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id),
  school_id UUID REFERENCES schools(id),
  distance_meters INTEGER,
  duration_seconds INTEGER,
  route_polyline TEXT,
  calculated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Docker Setup

### docker-compose.yml

```yaml
version: '3.8'
services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: onmyway
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

---

## Environment Variables

```env
# App
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/onmyway

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# OSRM (MVP: public, Production: self-hosted)
OSRM_BASE_URL=http://router.project-osrm.org

# Redis (optional phase 2)
REDIS_URL=redis://localhost:6379
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "start": "nest start",
    "start:dev": "nest start --watch",
    "build": "nest build",
    "lint": "eslint \"{src,apps,libs}/**/*.ts\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  }
}
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "@nestjs/core": "^10.0.0",
    "@nestjs/common": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "typeorm": "^0.3.0",
    "pg": "^8.0.0",
    "axios": "^1.0.0",
    "bcrypt": "^5.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/jest": "^29.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0"
  }
}
```
