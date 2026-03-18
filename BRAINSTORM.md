# Brainstorm: onMyWay — App de Notificação de Chegada

## O Produto

App mobile que mostra em tempo real quando pais estão chegando na escola, com **fila ordenada por ETA realista baseada em rota calculada**.

**MVP — Caso de uso principal: Pickup escolar**
1. Pais compartilham localização no app (privacidade: só após 1km da escola)
2. Backend calcula rota real (via OSRM) até a escola
3. Calcula ETA baseado na distância da rota (não trânsito em tempo real)
4. Escola vê painel interativo com **fila ordenada por tempo de chegada**
   - "João chegará em 8min"
   - "Maria chegará em 12min"
   - "Pedro chegará em 25min"
5. Diretora prepara alunos conforme ETA vai atualizando

**Outras aplicações de mercado:**
- Entregas (cliente vê fila de entregadores chegando)
- Taxi/motorista de app (vê fila de veículos)
- Serviços domésticos (encanador, eletricista com ETA)
- Viagens em grupo (avisa amigos quando chega)
- Empresas (visitantes com agenda de chegada)

---

## Fluxo técnico básico

### Usuário (Pai/Mãe)
```
[Instala app]
    ↓
[Login/cadastro]
    ↓
[Compartilha localização (sempre)]
    ↓
[App envia local em tempo real pra backend]
    ↓
[Backend calcula distância até destino]
    ↓
[Quando chega perto → notifica receptor]
```

### Receptor (Escola/estabelecimento)
```
[Admin da escola se cadastra]
    ↓
[Cria lista de alunos]
    ↓
[Aguarda notificações]
    ↓
[Recebe aviso: "João, Maria, Pedro chegando"]
    ↓
[Painel web em tempo real mostrando chegadas]
```

---

## Stack técnico preliminar

| Camada | Tecnologia | Motivo |
|---|---|---|
| Mobile | React Native (Expo) | Marcos conhece, funciona iOS/Android |
| Backend | Node.js (Nest.js) | Escalável, real-time, fácil integração |
| Banco | PostgreSQL + PostGIS | Geolocalização, armazenar rotas/ETAs |
| Real-time | WebSocket (Socket.io) | Atualizar fila em tempo real |
| Roteamento | **OSRM (Open Source)** | Calcular rota real + ETA (grátis, self-hosted) |
| Geo-cálculo | PostGIS (PostgreSQL) | Geofence de 1km (privacidade) |
| Mapa Dashboard | React Leaflet + OSRM polylines | Mostrar pins se movendo, rotas traçadas |
| Notificações | Firebase Cloud Messaging (FCM) | Push quando chegam perto (opcional) |
| Hospedagem | Railway (backend + OSRM) + Vercel (web) | Brasil, escalável |

---

## MVP Scope

**Dentro do MVP:**
- ✅ App mobile: compartilha localização (privacidade: só após 1km da escola)
- ✅ Backend: recebe localização, calcula rota via OSRM, estima ETA realista
- ✅ Dashboard web: **painel com fila de pais ordenada por ETA**
- ✅ **Mapa interativo** com pins se movendo em tempo real (React Leaflet)
- ✅ Rotas traçadas no mapa (polylines do OSRM)
- ✅ Geofence: notifica quando < 500m (opcional)
- ✅ Autenticação multi-tenant (cada escola vê seus dados)
- ✅ Piloto com 3-5 escolas reais

**Fora (Fase 2+):**
- ❌ Notificações push (por enquanto só painel web)
- ❌ Chat entre pais e escola
- ❌ Histórico detalhado
- ❌ Gerenciamento de fotos/perfil
- ❌ Integração com SigJDE (sistema da escola)

---

## Tecnologias principais

**Frontend (Mobile):**
- React Native + Expo
- React Navigation (navegação)
- React Query (dados)
- Geolocalização nativa

**Backend:**
- Node.js + Nest.js + TypeScript
- PostGIS (geographic queries)
- Socket.io (real-time)
- FCM (Firebase) para push

**Banco:**
- PostgreSQL + PostGIS extension
- Redis (cache/sessões)

**Dashboard:**
- React ou Next.js
- WebSocket para live updates

---

## Viabilidade técnica

✅ **Totalmente viável**

- Localização em tempo real = React Native tem APIs nativas
- Distância = cálculo simples (Haversine ou PostGIS)
- Geofence = comparação de distância
- Notificações = Firebase FCM (fácil)
- Real-time = WebSocket (padrão)

**Complexidade:** Média (não é tão simples quanto whatsap-info, mas bem viável)

---

## Tempo estimado (MVP com OSRM + Mapa)

- Backend (OSRM integration + geofence + WebSocket): **2-3 semanas**
- App mobile (location sharing + UI): **2-3 semanas**
- Dashboard web (fila + mapa interativo com React Leaflet): **2-3 semanas**
- Integração + testes + deployment: **1-2 semanas**

**Total:** ~**7-11 semanas** para MVP completo (em paralelo com Thoryx OU sequencial)

---

## Custos infraestrutura/mês

| Item | Custo |
|---|---|
| Backend (Railway Node.js) | ~R$20-50 |
| OSRM self-hosted (Railway) | ~R$30-50 |
| PostgreSQL + PostGIS (Railway) | ~R$10-30 |
| Redis (cache, Railway) | ~R$5-15 (optional) |
| Firebase FCM | Gratuito até 100k notificações |
| Vercel (frontend) | Gratuito |
| **Total MVP** | **~R$65-145/mês** |

**Modelo de precificação sugerido:** R$200-300/mês por escola
**Margem:** ~60-70% (excelente para SaaS)

**Variação:** Se usar OSRM público (gratuito) em vez de self-hosted = ~R$35-95/mês (mas depende de servidor externo)

Escalável para centenas de escolas sem grandes custos.

---

## Aplicações de mercado (além de escolas)

| Caso | Receptor | Volume | Potencial |
|---|---|---|---|
| Pickup escolar | Escolas | ~1,000s escolas | Alto (problema real, disposição de pagar) |
| Entregas | E-commerce | ~100,000s | Alto (logística) |
| Taxi/motorista | Passageiros | Automático (app) | Alto (Uber-like) |
| Serviços domésticos | Clientes | PMEs | Médio |
| Viagens de grupo | Amigos | B2C | Médio |

---

## OSRM em Detalhes (Open Source Routing Machine)

**O que é:** Servidor gratuito que calcula rotas otimizadas e ETA baseado na distância real (não trânsito).

**Funcionamento:**
```
Backend recebe localização do pai
       ↓
Chama OSRM: "Rota de A até B?"
       ↓
OSRM calcula: "2.8km, 8min via Rua X e Avenida Y"
       ↓
Backend exibe na fila: "João - ETA 8min"
```

**2 Opções:**

| Opção | Custo | Setup | Ideal para |
|---|---|---|---|
| **OSRM Público** (router.project-osrm.org) | R$0 | 5 min | MVP (gratuito) |
| **OSRM Self-hosted** (Railway Docker) | ~R$30-50/mês | 4-8h | Produção (privacidade) |

**Recomendação:** MVP com OSRM público → self-hosted quando escalar (>100 escolas)

**ETA baseado em:**
- Distância da rota real (não linha reta)
- Velocidade média das ruas (30-80 km/h)
- NÃO inclui trânsito em tempo real = custo zero

---

## Próximos passos

- [ ] Validar demanda com 3-5 escolas (disposição de pagar R$200-300/mês?)
- [ ] Legal review: LGPD (localização é dado sensível)
- [ ] Protótipo do backend + OSRM (1 semana)
- [ ] Teste com 1 escola piloto

---

## Perguntas ainda em aberto

1. **Quanto cobrar?** R$100/mês por escola? R$500?
2. **Quantos pais por escola?** Isso muda a escala
3. **Frequência de updates de localização?** A cada 5seg? 30seg?
4. **Qual raio de geofence?** 500m? 1km?
