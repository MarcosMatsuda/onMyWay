# onMyWay Backend API

Real-time arrival notification API for schools and parents.

## Quick Start

### Prerequisites
- Node.js v18+ (we use v22.22.1)
- PostgreSQL 12+ (with PostGIS for geofence queries)
- Docker (optional, for local PostgreSQL)

### Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Create database** (if not using Docker)
   ```bash
   createdb onmyway_dev
   psql onmyway_dev -c "CREATE EXTENSION IF NOT EXISTS postgis"
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run migrations**
   ```bash
   npm run migration:run
   ```

5. **Seed test data**
   ```bash
   npm run seed
   ```

6. **Start development server**
   ```bash
   npm run start:dev
   ```

Server runs on `http://localhost:3000`

## NPM Scripts

### Development
- `npm run start` — Start production server
- `npm run start:dev` — Start with hot reload
- `npm run start:debug` — Start with debugger

### Build & Quality
- `npm run build` — Compile TypeScript
- `npm run lint` — Run ESLint with Prettier
- `npm run lint --fix` — Auto-fix linting errors

### Testing
- `npm test` — Run unit tests
- `npm run test:watch` — Run tests in watch mode
- `npm run test:coverage` — Generate coverage report
- `npm run test:integration` — Run integration tests
- `npm run test:all` — Run all test suites

### Database
- `npm run migration:run` — Apply pending migrations
- `npm run migration:revert` — Revert last migration
- `npm run migration:generate` — Generate migration from entity changes
- `npm run migration:create` — Create blank migration file
- `npm run seed` — Create test school + parent (idempotent)
- `npm run seed:reset` — Clear and reseed test data

## Project Structure

```
src/
├── domain/               # Business logic (entities, use cases, interfaces)
│   ├── entities/        # Domain models (School, Parent, Location, ETA)
│   ├── repositories/    # Repository interfaces (contracts)
│   └── use-cases/       # Application logic (orchestrates repositories)
├── data/                # Data access layer (TypeORM)
│   ├── models/          # TypeORM entities (database models)
│   ├── mappers/         # Domain ↔ Database mapping
│   └── repositories/    # Repository implementations
├── presentation/        # HTTP layer (controllers, DTOs)
│   ├── auth/           # Authentication endpoints
│   ├── locations/      # Location tracking endpoints
│   └── schools/        # School management endpoints
├── infrastructure/      # Cross-cutting concerns
│   ├── auth/           # JWT, guards, strategies
│   ├── config/         # Environment validation
│   ├── database/       # TypeORM setup, migrations
│   ├── filters/        # Exception filters
│   ├── interceptors/   # Logging, request tracking
│   └── osrm/           # OSRM routing service
└── main.ts             # Application bootstrap
```

## API Documentation

### Swagger/OpenAPI
Visit `http://localhost:3000/api/docs` for interactive API documentation.

Available at: `GET /api/docs`

### Core Endpoints

**Authentication**
- `POST /auth/register` — Register new parent
- `POST /auth/login` — Login and receive JWT
- `GET /auth/profile` — Get authenticated parent profile

**Locations**
- `POST /locations` — Save parent location (triggers ETA calculation)
- `GET /locations/me` — Get current location + ETA

**Schools**
- `POST /schools` — Create school (JWT required)
- `GET /schools` — List all schools
- `GET /schools/:id/arrivals` — Get parents within geofence (JWT required)
- `GET /schools/:id/stats` — Get arrival statistics (JWT required)
- `POST /schools/:id/config` — Update school config (JWT required)

**WebSockets**
- `WS /socket.io` — Real-time arrivals updates
  - Listen: `arrivalsUpdated` — Emitted when parents enter/leave geofence

## Testing Workflow

### 1. Create Test Data
```bash
npm run seed
# Output: email=test@onmyway.dev, password=Test@1234, schoolId=<uuid>
```

### 2. Register & Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@onmyway.dev","password":"Test@1234"}'
# Returns: { "token": "eyJ...", "parent": {...} }
```

### 3. Save Location
```bash
curl -X POST http://localhost:3000/locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"lat":-23.5505,"lng":-46.6333,"accuracy":10}'
```

### 4. Use Postman Collection
Import `docs/postman/onMyWay.postman_collection.json` for pre-configured endpoints with auto-token management.

## Environment Variables

Required in `.env`:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=onmyway_dev

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=debug|info|warn|error

# CORS
CORS_ORIGIN=http://localhost:3000

# OSRM (Optional: for ETA calculation)
OSRM_BASE_URL=http://localhost:5000

# Node
NODE_ENV=development|production
```

## Running with Docker

### Full Stack (Database + App)
```bash
# Start PostgreSQL + PostGIS
docker run --name onmyway-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=onmyway_dev \
  -p 5432:5432 \
  postgis/postgis:16-3.4

# Run migrations and seed
npm run migration:run
npm run seed

# Start app
npm run start:dev
```

### OSRM Service (for ETA calculation)
```bash
docker run -d -p 5000:5000 \
  -v $PWD/osrm-data:/data \
  osrm/osrm-backend:v5.27.1
```

## Code Quality

### Linting
```bash
npm run lint              # Check for issues
npm run lint --fix       # Auto-fix issues
```

### Testing
```bash
npm test                  # Run all unit tests
npm run test:coverage     # Generate coverage report
```

Target: >80% coverage for critical paths (auth, locations, schools)

### Git Workflow
1. Create branch from `develop`: `git checkout -b feat/issue-XX`
2. Make changes and test locally
3. Open PR against `develop`
4. Ensure all checks pass:
   - ✅ npm run lint
   - ✅ npm run build
   - ✅ npm test
5. Merge to `develop` after review

## Architecture Decisions

### Clean Architecture
- **Domain layer** — Pure business logic, no dependencies
- **Data layer** — Database access via repositories
- **Presentation layer** — HTTP contracts (controllers, DTOs)
- **Infrastructure** — Cross-cutting concerns (auth, logging, config)

### Exception Handling
- **Structured responses** — All errors return JSON with statusCode, message, timestamp, path
- **Production-safe** — Stack traces never exposed in HTTP responses, only in logs
- **Fail-fast** — Validation errors returned immediately, no silent failures

### Security
- **JWT authentication** — Bearer token in Authorization header
- **Rate limiting** — Global 100 req/min, auth endpoints 10 req/min
- **Helmet** — Security headers (HSTS, CSP, etc.)
- **CORS** — Configurable origins
- **Password hashing** — bcrypt with salt rounds

### Logging
- **Request tracking** — All requests logged with method, path, status, duration
- **Error logging** — Full stack traces in logs, never in HTTP responses
- **Structured format** — JSON logging for easy parsing

## Troubleshooting

### Database connection errors
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Verify extensions
psql onmyway_dev -c "SELECT * FROM pg_extension"
```

### Migration errors
```bash
# Check migration history
npm run migration:run -- --query

# Revert last migration
npm run migration:revert
```

### Test failures
```bash
# Run tests in watch mode for debugging
npm run test:watch

# Run with verbose output
npm test -- --verbose
```

## Performance

### Query Optimization
- **N+1 prevention** — Use JOINs and eager loading
- **Geofence queries** — PostGIS spatial indexes (GIST)
- **Caching** — Redis for session/token management (future)

### Monitoring
- **Request logging** — Track latency per endpoint
- **Error tracking** — Centralized error handling
- **Database metrics** — Query times, connection pool

## Contributing

1. Fork and create feature branch from `develop`
2. Follow code style (enforced by ESLint + Prettier)
3. Add tests for new functionality
4. Ensure all checks pass
5. Open PR with description
6. Respond to review feedback

## License

Proprietary — onMyWay Project
