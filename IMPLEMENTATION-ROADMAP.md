# onMyWay — Implementation Roadmap

**Data:** 2026-03-18
**Status:** Planejamento
**Timeline MVP:** 8-9 semanas
**Arquitetura:** Clean Architecture (como Thoryx)
**Framework Mobile:** Expo (como Thoryx)

---

## 📊 Visão Executiva

**Produto:** App de notificação de chegada em tempo real para pickup escolar
**MVP:** Pais compartilham localização → Escola vê fila ordenada por ETA realista
**Diferencial:** Usa OSRM (open-source) pra calcular rota real + ETA
**Mercado:** Escolas (MVP) → Entregas, Taxi, Serviços (fase 2+)
**Preço:** R$200-300/mês por escola
**Margem:** 60-70% (custa R$65-145/mês de infra)

---

## 🎯 Fases de Desenvolvimento

### **Fase 0: Setup (1 dia)**

**O quê:**
- [ ] Criar estrutura de pastas (backend/, mobile/, web/)
- [ ] `.project-config.json` (config do projeto)
- [ ] README.md (overview)
- [ ] ARCHITECTURE.md (diagrama de sistema)
- [ ] SETUP.md (como rodar localmente)
- [ ] docker-compose.yml (PostgreSQL + Redis)
- [ ] .env.example (variáveis de ambiente)
- [ ] .gitignore (Node, React Native, Next.js)
- [ ] Git setup (main, develop, feature/* branches)

**Resultado:** Projeto pronto para começar desenvolvimento

---

### **Fase 1: Backend (2-3 semanas)**

**Semana 1-2:**

1. **Setup Nest.js + Stack**
   - [ ] Nest.js + TypeScript + ESLint
   - [ ] PostgreSQL + PostGIS setup
   - [ ] Redis (cache/sessões)
   - [ ] Environment variables
   - [ ] Docker compose rodando

2. **Domain Layer**
   - [ ] Entities
     - Parent (id, name, email, phone)
     - School (id, name, location, config)
     - Location (parentId, lat, lng, timestamp, accuracy)
     - ETA (parentId, distanceMeters, durationMinutes, routePolyline)
   - [ ] Repository Interfaces
     - IParentRepository
     - ISchoolRepository
     - ILocationRepository
     - IETARepository
   - [ ] Use Cases
     - SaveLocationUseCase
     - CalculateETAUseCase
     - GetArrivalsQueueUseCase
     - NotifySchoolUseCase

3. **Data Layer**
   - [ ] Repository Implementations
     - ParentRepository
     - SchoolRepository
     - LocationRepository
     - ETARepository
   - [ ] Database Models (Typeorm/Prisma)
   - [ ] DTOs & Mappers

4. **Infrastructure Layer**
   - [ ] HTTP Client (Axios)
   - [ ] OSRM Integration
     - calculateRoute(parentLat, parentLng, schoolLat, schoolLng)
     - retorna: {distance, duration, polyline}
   - [ ] PostGIS Geofence
     - ST_Distance query
     - Geofence checker (1km privacidade)
   - [ ] WebSocket Setup (Socket.io)
   - [ ] Firebase FCM Setup

5. **Presentation Layer (Controllers)**
   - [ ] AuthController
     - POST /auth/register
     - POST /auth/login
     - GET /auth/profile
   - [ ] LocationController
     - POST /locations (pais envia localização)
       → calcula ETA, avisa escola
     - GET /locations/me (sua localização atual)
   - [ ] SchoolController
     - GET /schools/:id/arrivals (fila ordenada por ETA)
     - GET /schools/:id/stats
     - POST /schools/:id/config (threshold, notificações)
   - [ ] WebSocket Gateway
     - /ws/schools/:id (updatos em tempo real)

6. **Testes**
   - [ ] Unit tests (use cases)
   - [ ] Integration tests (repositories)
   - [ ] Controller tests

**Resultado:** API funcional, tudo rodando localmente

---

### **Fase 2: App Mobile Expo (2-3 semanas) [paralelo com Fase 1 se tiver team]**

**Semana 2-3:**

1. **Setup Expo + Clean Architecture**
   - [ ] Expo init
   - [ ] Estrutura de pastas (domain/, data/, infrastructure/, presentation/)
   - [ ] tsconfig.json (paths: @domain, @data, @infrastructure)
   - [ ] ESLint + Prettier

2. **Domain Layer**
   - [ ] Entities
     - Parent (id, name, phone)
     - School (id, name, location)
     - CurrentLocation (lat, lng, accuracy, timestamp)
     - ETA (minutes, distance, polyline)
   - [ ] Repository Interfaces
     - ILocationRepository
     - IParentRepository
     - ISchoolRepository
   - [ ] Use Cases
     - GetCurrentLocationUseCase
     - SendLocationUseCase
     - GetArrivalsUseCase
     - WatchSchoolArrivalsUseCase (real-time)

3. **Data Layer**
   - [ ] Repositories (API calls)
     - LocationRepository (calls backend)
     - ParentRepository
     - SchoolRepository
   - [ ] Local Storage
     - AsyncStorage (token, school selection)
     - SecureStore (sensitive data)
   - [ ] DTOs & Mappers

4. **Infrastructure Layer**
   - [ ] Geolocation Service
     - Background location updates (10-30s)
     - Privacy: só envia após 1km da escola
     - Battery optimization
   - [ ] HTTP Client
     - Axios + interceptors
     - Token refresh
   - [ ] WebSocket Client
     - Socket.io para updatos em tempo real
   - [ ] Notifications
     - Firebase FCM setup
     - Push notification handler

5. **Presentation Layer**
   - [ ] Screens
     - AuthScreen (login/register)
     - HomeScreen (start/stop sharing, status)
     - SchoolSelectionScreen (escolher escola)
     - MapScreen (ver escola + sua rota + ETA)
     - ProfileScreen (settings, logout)
   - [ ] Components
     - LocationIndicator
     - ETACard
     - MapView
   - [ ] Hooks
     - useLocation (custom hook)
     - useArrivals (real-time)
     - useAuth (autenticação)
   - [ ] Navigation (React Navigation)

6. **Testes**
   - [ ] Unit tests (use cases)
   - [ ] Component tests (RTL)

**Resultado:** App funcional, conectado ao backend

---

### **Fase 3: Web Dashboard (2 semanas)**

**Semana 4-5:**

1. **Setup Next.js + React**
   - [ ] Next.js 14 + TypeScript
   - [ ] Tailwind CSS
   - [ ] ESLint + Prettier

2. **Authentication**
   - [ ] Clerk ou Supabase Auth
   - [ ] Login/logout
   - [ ] Protected routes

3. **Pages**
   - [ ] /auth/login (admin da escola)
   - [ ] /dashboard/[schoolId]/arrivals
     - Mapa interativo (React Leaflet)
     - Lista de chegadas (em tempo real)
     - Ordenada por ETA
   - [ ] /dashboard/[schoolId]/settings
     - Threshold de notificação
     - Configurações de privacidade

4. **Components**
   - [ ] ArrivalMap
     - React Leaflet
     - Pins dos pais (atualizando em tempo real)
     - Rotas traçadas (polylines do OSRM)
     - Escola como ponto fixo
   - [ ] ArrivalList
     - Lista de pais
     - Ordenada por ETA
     - Status visual (cores: vermelho <5min, amarelo 5-15min, verde >15min)
   - [ ] RealtimeUpdates
     - WebSocket connection
     - Auto-refresh quando chegam/saem pais
   - [ ] Navigation/Header

5. **API Integration**
   - [ ] Fetch arrivals
   - [ ] WebSocket subscriptions
   - [ ] Real-time updates

6. **Testes**
   - [ ] Component tests
   - [ ] Integration tests

**Resultado:** Dashboard pronto, escola pode usar

---

### **Fase 4: Integração + Testes + Piloto (1-2 semanas)**

**Semana 5-6:**

1. **E2E Tests**
   - [ ] Flow completo: pai envia localização → escola vê fila
   - [ ] Testes de real-time (WebSocket)
   - [ ] Testes de geofence (1km de privacidade)

2. **Load Testing**
   - [ ] Simular 100 pais simultâneos
   - [ ] Verificar latência WebSocket
   - [ ] PostGIS performance
   - [ ] OSRM response time

3. **Security & Privacy**
   - [ ] LGPD compliance review (com advogado)
   - [ ] Encryption in-transit (HTTPS)
   - [ ] Encryption at-rest (dados sensíveis)
   - [ ] Data retention policy

4. **Deploy**
   - [ ] Backend → Railway
   - [ ] App → EAS build (iOS + Android)
   - [ ] Web → Vercel
   - [ ] Domain setup (pedir.app ou delivery.app)

5. **Piloto com Escolas**
   - [ ] Contatar 3-5 escolas amigas
   - [ ] Deploy em produção
   - [ ] Feedback dos usuários
   - [ ] Ajustes críticos

**Resultado:** MVP em produção, validação com usuários reais

---

## 📅 Timeline

### Opção A: Sequencial (sozinho)
```
Semana 1-3:   Backend
Semana 4-6:   App Mobile
Semana 7-8:   Web Dashboard
Semana 9:     Integração + Piloto
─────────────────────────────
Total: 9 semanas
```

### Opção B: Paralelo (com team)
```
Semana 1-2:   Backend (pessoa A) + App setup (pessoa B)
Semana 2-3:   Backend finaliza + App development
Semana 3-4:   App + Web paralelo
Semana 4-5:   Integração + testes
─────────────────────────────
Total: 5 semanas
```

---

## 🏗️ Arquitetura: Clean Architecture

### Mobile (Expo)
```
presentation/   (screens, components, hooks)
    ↓
domain/        (entities, repositories interfaces, use-cases)
    ↓
data/          (repository implementations, models, DTOs)
    ↓
infrastructure/ (geolocation, http, websocket, storage)
```

### Backend (Nest.js)
```
presentation/   (controllers, websocket gateway)
    ↓
application/   (dtos, services)
    ↓
domain/        (entities, repositories interfaces, use-cases)
    ↓
data/          (repository implementations, database models)
    ↓
infrastructure/ (http, osrm, postgis, firebase)
```

---

## 🔑 Decisões Técnicas Críticas

| Decisão | Escolha | Por quê |
|---------|---------|--------|
| **Routing** | OSRM (open-source) | Gratuito, auto-hospedável, cálculo de rota real |
| **Servidor OSRM** | Público (MVP) → Self-hosted (escala) | MVP = grátis, depois controle total |
| **Privacidade** | Geofence 1km | Pai só é rastreado perto da escola |
| **Real-time** | WebSocket (Socket.io) | <100ms latência, escalável |
| **Notificações** | Firebase FCM | Gratuito, confiável |
| **Mobile** | Expo (vs React Native puro) | Mais rápido, já usa Thoryx |
| **Arquitetura** | Clean (como Thoryx) | Testabilidade, manutenibilidade |

---

## 💰 Custos Estimados

| Camada | Custo/mês | Observações |
|--------|-----------|-------------|
| Backend (Railway) | R$20-50 | Node.js container |
| OSRM Self-hosted (Railway) | R$30-50 | Quando escalar; público é grátis no MVP |
| PostgreSQL + PostGIS (Railway) | R$10-30 | Compartilhado com backend |
| Redis (Railway) | R$5-15 | Opcional, para performance |
| Vercel (Web) | R$0 | Gratuito |
| Firebase (FCM) | R$0 | Grátis até 100k msgs |
| **Total MVP** | **R$65-145/mês** | Muito escalável |

**Modelo de preço:** R$200-300/mês por escola = **margem de 60-70%**

---

## ✅ Checklist MVP (Go/No-Go)

- [ ] Fase 0: Setup completo
- [ ] Fase 1: Backend 100% funcional
- [ ] Fase 2: App 100% conectado ao backend
- [ ] Fase 3: Web dashboard 100% funcional
- [ ] Fase 4: Testes E2E passing
- [ ] Fase 4: Load test OK (100 pais)
- [ ] Fase 4: LGPD review aprovado
- [ ] Fase 4: Piloto com 3 escolas rodando
- [ ] Fase 4: Deploy em produção

**Status:** ⏳ Aguardando início

---

## 📌 Próximos Passos Imediatos

1. **Validação Rápida (1 semana):**
   - Conversar com 3-5 escolas amigas
   - "Gostariam de um app que mostra quando pais chegam?"
   - "Pagariam R$200-300/mês?"
   - Se sim → vai para Fase 0

2. **Fase 0 (1 dia):**
   - Preparar estrutura de pastas
   - Criar `.project-config.json`
   - Setup GitHub

3. **Fase 1 (2-3 semanas):**
   - Começar backend
   - Definir banco de dados
   - Implementar API básica

---

## 📚 Documentação Relacionada

- `BRAINSTORM.md` — Visão do produto e stack
- `TECHNICAL-ARCHITECTURE.md` — Análise técnica profunda
- `ARCHITECTURE.md` — Diagrama de sistema
- `SETUP.md` — Como rodar localmente
