# Solicitação de Análise Técnica — onMyWay

**Para:** Analista-TI
**De:** Marcos
**Data:** 2026-03-18
**Projeto:** onMyWay — App de notificação de chegada em tempo real

---

## Contexto

Estamos explorando um novo app chamado **onMyWay**. É um produto com múltiplas aplicações de mercado, começando pelo caso de uso de pickup escolar:

- **MVP:** Pais compartilham localização → app notifica a escola quando chegam perto
- **Mercado expandido:** entregas, taxi, serviços domésticos, viagens em grupo
- **Timeline:** Quer validar viabilidade técnica agora (estamos finalizando o Thoryx)

Fiz um brainstorm inicial (veja `BRAINSTORM.md` na mesma pasta).

---

## Solicitação

Faça uma **análise técnica completa** do onMyWay respondendo:

### 1. Arquitetura
- [ ] Diagrama de componentes (mobile → backend → banco → web)
- [ ] Fluxo de dados (como localização flui pelo sistema)
- [ ] Responsabilidades de cada camada

### 2. Stack Técnico
- [ ] Validar as escolhas: React Native + Node.js + PostgreSQL + PostGIS
- [ ] Alternativas viáveis?
- [ ] Trade-offs (React Native vs Flutter? Nest.js vs FastAPI?)

### 3. Geolocalização & Geofence
- [ ] PostGIS é o certo? (vs outras soluções)
- [ ] Como calcular "chegando perto"? (algoritmos, precisão)
- [ ] Geofence dinâmico vs círculo fixo?
- [ ] Performance com 1,000 pais + 100 escolas?

### 4. Tempo Real
- [ ] WebSocket (Socket.io) é suficiente? (vs outras)
- [ ] Frequência de update de localização (cada 5seg? 30seg?)
- [ ] Latência esperada?

### 5. Notificações
- [ ] Firebase Cloud Messaging é o certo?
- [ ] Confiabilidade (garantir que notificação chega?)
- [ ] Custo escala?

### 6. Dados Sensíveis
- [ ] Localização é dado sensível — como proteger?
- [ ] Privacidade: como garantir que só a escola vê a localização?
- [ ] Compliance LGPD (Lei brasileira)?

### 7. Estimativas
- [ ] Tempo desenvolvimento do MVP (frontend + backend + web)
- [ ] Custo infraestrutura/mês (1, 10, 100 escolas)
- [ ] Quando fica lucrativo?

### 8. Riscos & Viabilidade
- [ ] Qual é a maior complexidade técnica?
- [ ] Há algo que seja showstopper?
- [ ] É viável fazer em paralelo com Thoryx?

### 9. Roadmap
- [ ] MVP v1 (o que entra, o que fica de fora)
- [ ] Fases até ser um produto completo

---

## Material de Referência

- `BRAINSTORM.md` — visão inicial do produto e stack
- `/openclaw/agents/analista-ti/TOOLS.md` — ferramentas disponíveis
- Contexto do Marcos: `/openclaw/USER.md` (especialista mobile React Native, orçamento limitado)

---

## Formato da Resposta

Por favor, retorne:
1. Arquivo `ANALYSIS.md` na mesma pasta com conclusões
2. Documento visual (diagrama de arquitetura) se possível
3. Resumo executivo com recomendações
4. Go/No-go: é viável? Vale a pena? Quando começa?

---

## Timeline

- Quando tiver capacidade — não é urgente (Thoryx é prioridade)
- Mas antes de começar o desenvolvimento real

Obrigado!
