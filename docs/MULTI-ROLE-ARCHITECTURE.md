# Multi-Role Architecture

## Overview

The onMyWay system requires role-based access control to separate portal administration from parent mobile usage. This document describes the architecture for the multi-role system.

## Roles

| Role | Platform | Capabilities |
|------|----------|-------------|
| `super_admin` | Web portal | Create schools, create school-admins, view all schools |
| `school_admin` | Web portal | View arrivals for their school, settings, manage parents |
| `parent` | Mobile app | Share location, view map |

## Data Model

### Separate Entities: User vs Parent

Parents and admins are modeled as **separate entities** in separate tables. They share nothing except the JWT signing secret.

**Why not a single entity?**
- Parents use mobile, admins use web — different domains
- Mixing them creates a God entity with role-conditional fields
- Separate tables = simpler queries, cleaner type safety, independent evolution

### User Table (new)

```sql
CREATE TABLE "users" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"          varchar(255) NOT NULL,
  "email"         varchar(255) NOT NULL UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "role"          varchar(20) NOT NULL DEFAULT 'school_admin'
                  CHECK (role IN ('super_admin', 'school_admin')),
  "school_id"     uuid REFERENCES "schools"("id") ON DELETE SET NULL,
  "created_at"    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

- `role` is VARCHAR with CHECK constraint (not ENUM — easier to extend without migration)
- `school_id` is nullable (super_admin has no fixed school)
- FK uses ON DELETE SET NULL (don't lose admin if school is removed)

### Parent Table (unchanged)

No changes to the parent entity or table.

## Authentication Architecture

### Two Passport Strategies

The system uses **two independent Passport strategies** instead of a single strategy with dual lookup:

```
┌──────────────────────────────────────────────────────────────┐
│                     JWT (same secret)                         │
├──────────────────────────┬───────────────────────────────────┤
│   JwtStrategy            │   AdminJwtStrategy                │
│   name: 'jwt'            │   name: 'jwt-admin'               │
│   resolves: Parent       │   resolves: User                  │
│   guard: JwtAuthGuard    │   guard: AdminJwtAuthGuard        │
│   used by: mobile app    │   used by: web portal             │
└──────────────────────────┴───────────────────────────────────┘
```

**Why two strategies?**
- `req.user` has a clear type: `Parent` on parent endpoints, `User` on admin endpoints
- No conditional logic in strategy — each does one thing
- Cross-isolation is automatic: parent token on admin endpoint → user table lookup fails → 401

### JWT Payload

```typescript
interface JwtPayload {
  sub: string;       // parent.id or user.id
  email: string;
  role?: string;     // 'parent' | 'school_admin' | 'super_admin'
  schoolId?: string;
}
```

- `role` is optional for backward compatibility (old parent tokens without role still work)
- `AdminJwtStrategy` rejects tokens without `role` or with `role === 'parent'`
- `JwtStrategy` does not check `role` at all

### Auth Endpoints

| Endpoint | Auth for | Returns |
|----------|----------|---------|
| `POST /auth/login` | Parent (mobile) | `{ accessToken, refreshToken, parent }` |
| `POST /auth/register` | Parent (mobile) | `{ accessToken, refreshToken, parent }` |
| `POST /admin/auth/login` | Admin (web) | `{ accessToken, refreshToken, user }` |

### WebSocket Compatibility

The `ArrivalsGateway` uses `jwtService.verify(token)` directly (not Passport). It validates any JWT signed with the same secret. Admin tokens work without any gateway changes. The `socket.data.parentId` field stores the `sub` claim for logging purposes only.

## Authorization

### Guards

```typescript
@Roles('super_admin')                           // only super-admin
@Roles('school_admin')                          // only school-admin
@Roles('super_admin', 'school_admin')           // both
@UseGuards(AdminJwtAuthGuard, RolesGuard)       // auth + role check
@UseGuards(AdminJwtAuthGuard, SchoolAccessGuard) // school_admin restricted to their school
```

### Endpoint Separation

Mobile and web use **separate endpoints** that call the same underlying use cases:

| Mobile (parent JWT) | Web (admin JWT) |
|---------------------|-----------------|
| `GET /schools/:id/arrivals` | `GET /admin/schools/:id/arrivals` |
| `GET /schools/:id/stats` | `GET /admin/schools/:id/stats` |
| `POST /locations` | — |
| — | `POST /admin/schools` |
| — | `POST /admin/schools/:id/config` |

## Web Portal Routing

### Middleware

The Next.js middleware decodes the JWT `role` field and routes accordingly:

| Role | Login redirect | Protected paths |
|------|---------------|-----------------|
| `super_admin` | `/admin/schools` | `/admin/*` |
| `school_admin` | `/dashboard/{schoolId}/arrivals` | `/dashboard/*` |

### Web Routes

```
/login                              — single login page for all admin roles

/admin/schools                      — list all schools (super_admin)
/admin/schools/new                  — create school (super_admin)
/admin/schools/[id]                 — school detail (super_admin)
/admin/schools/[id]/admins          — manage admins (super_admin)

/dashboard/[schoolId]/arrivals      — real-time arrivals (school_admin, exists)
/dashboard/[schoolId]/settings      — school config (school_admin, exists)
/dashboard/[schoolId]/parents       — manage parents (school_admin, future)
/dashboard/[schoolId]/invite        — invite code (school_admin, future)
```

## Parent Onboarding (Phase 4)

Schools get an auto-generated `invite_code` (8 alphanumeric characters). Parents use this code during mobile registration to link to their school.

```
School created by super-admin
  → invite_code auto-generated (e.g., "AB12CD34")
  → School distributes code (print, WhatsApp, etc.)
  → Parent downloads app, registers with invite code
  → Backend resolves code → schoolId, creates parent
```

## Implementation Phases

| Phase | Scope | Issues | Breaking changes |
|-------|-------|--------|-----------------|
| 1 | Backend: User entity + admin auth | #224 | None |
| 2 | Web: admin login + routing + pages | #225 | Web login changes |
| 3 | Backend: guards + admin school endpoints | #226 | School mutation endpoints require admin |
| 4 | Invite code + mobile registration | #227 | Mobile registration adds invite code |
| 5 | Admin CRUD + polish | #228 | None |

Each phase is a separate PR. Phase N depends on Phase N-1. Mobile is unaffected until Phase 4.

## Module Structure (Backend)

```
backend/src/
├── domain/
│   ├── entities/
│   │   └── user.entity.ts              ← NEW
│   └── repositories/
│       └── user.repository.interface.ts ← NEW
├── data/
│   ├── models/
│   │   └── user.model.ts               ← NEW
│   ├── mappers/
│   │   └── user.mapper.ts              ← NEW
│   └── repositories/
│       └── user.repository.ts           ← NEW
├── infrastructure/
│   ├── auth/
│   │   ├── admin-jwt.strategy.ts        ← NEW
│   │   ├── admin-jwt-auth.guard.ts      ← NEW
│   │   ├── roles.decorator.ts           ← NEW (Phase 3)
│   │   ├── roles.guard.ts              ← NEW (Phase 3)
│   │   ├── school-access.guard.ts       ← NEW (Phase 3)
│   │   └── jwt-payload.interface.ts     ← MOD (add role)
│   └── database/
│       └── migrations/
│           └── 1711200000000-CreateUsersTable.ts ← NEW
├── presentation/
│   ├── admin/
│   │   ├── admin.module.ts              ← NEW
│   │   ├── admin-auth.controller.ts     ← NEW
│   │   ├── admin-auth.service.ts        ← NEW
│   │   ├── admin-schools.controller.ts  ← NEW (Phase 3)
│   │   └── dtos/
│   │       ├── admin-login.dto.ts       ← NEW
│   │       └── admin-auth-response.dto.ts ← NEW
│   └── auth/
│       └── auth.service.ts              ← MOD (add role to parent JWT)
└── scripts/
    └── seed-super-admin.ts              ← NEW
```
