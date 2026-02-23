# Neighborhood Grocery List

A household grocery app where one person adds "Whole Milk" to the list, another approves it, and someone buys it on the way home. Budget tracked to the cent. Roles enforced on every request. State machine catches every invalid transition.

Built as a companion project for [Building Microservices Full-Stack: From Zero to Production](https://github.com/GX-Coin-Protocol/backend-core/blob/dev/docs/lectures/building-microservices-fullstack.md) — a 5,400-line guide that explains every line of this codebase.

```
Browser → Next.js BFF → Express API → PostgreSQL
  :3000     :3000/api      :3060         :5432

React UI        Reads cookie,     Clean Architecture    Prisma ORM
TanStack Query  forwards JWT      Domain → App → Infra  Multi-file schema
React Hook Form as Bearer token   Zod validation        Seeded test data
```

## What It Does

**Member** adds an item → status: `PENDING`
**Manager** approves it → status: `APPROVED`
**Anyone** marks it bought → status: `BOUGHT`, budget deducted

Try to approve a bought item? The state machine says no:
```json
{
  "code": "INVALID_ITEM_STATE",
  "message": "Cannot approve item: status is BOUGHT, must be APPROVED"
}
```

Try to buy something that exceeds the budget? Blocked:
```json
{
  "code": "BUDGET_EXCEEDED",
  "message": "Purchase would exceed monthly budget"
}
```

Every error has a code, a message, and details. No guessing.

## Quick Start

**Prerequisites**: Node.js 20+, Docker (for PostgreSQL)

```bash
# 1. Start PostgreSQL
docker run -d --name grocery-postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=grocery_db -p 5432:5432 postgres:16

# 2. Install everything
npm install

# 3. Set up the database
cd packages/core-db
npx prisma generate && npx prisma db push && npx prisma db seed
cd ../..

# 4. Start the backend (port 3060)
cd apps/svc-grocery && npm run dev &

# 5. Start the frontend (port 3000)
cd grocery-web && npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll hit the login page.

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Manager (approve/reject items) | `manager@grocery.test` | `grocery123` |
| Member (add items, mark bought) | `member@grocery.test` | `grocery123` |

## Architecture

This isn't a TODO app with a database bolted on. It's **Clean Architecture** — four layers, each with one job:

```
┌─────────────────────────────────────────────┐
│  Interface    Controllers, routes, middleware │  Translates HTTP ↔ use cases
├─────────────────────────────────────────────┤
│  Application  Use cases, DTOs, ports         │  Orchestrates business logic
├─────────────────────────────────────────────┤
│  Domain       Errors, value objects          │  Pure rules, zero dependencies
├─────────────────────────────────────────────┤
│  Infrastructure  Prisma repositories         │  Talks to the database
└─────────────────────────────────────────────┘
```

Dependencies point **inward**. The domain layer doesn't know Express exists. The use cases don't know Prisma exists. You could swap PostgreSQL for MongoDB and only the infrastructure layer changes.

## API

| Method | Endpoint | Auth | What it does |
|--------|----------|------|-------------|
| `GET` | `/health` | — | Health check |
| `POST` | `/api/v1/auth/login` | — | Returns JWT token |
| `GET` | `/api/v1/grocery/lists/:listId` | Bearer | Items + budget summary |
| `POST` | `/api/v1/grocery/lists/:listId/items` | Member+ | Add a grocery item |
| `POST` | `/api/v1/grocery/items/:itemId/approve` | Manager | Approve or reject |
| `POST` | `/api/v1/grocery/items/:itemId/buy` | Member+ | Mark as bought |

## Project Structure

```
├── apps/svc-grocery/src/
│   ├── domain/           Errors, Money value object, ItemStatus state machine
│   ├── application/      Use cases, DTOs, repository interfaces (ports)
│   ├── infrastructure/   Prisma repository implementations
│   ├── interface/        Express controllers, routes, auth + validation middleware
│   └── shared/di/        Manual dependency injection (no framework magic)
├── packages/core-db/
│   └── prisma/schema/    Multi-file Prisma schema (config, enums, models)
├── grocery-web/src/
│   ├── app/              Next.js pages + BFF API routes
│   ├── components/       React UI (BudgetBar, ItemCard, AddItemForm)
│   └── lib/              API client, TanStack Query hooks, query keys
├── k8s/                  Kubernetes manifests (Deployment, Service, ConfigMap, Secret)
└── docker-compose.yml    One command: backend + database
```

## Tests

**10 unit tests** — domain errors, Money value object, CreateItem use case:
```bash
cd apps/svc-grocery && npx vitest run
```

**13 Playwright E2E tests** — login, view list, add item, approve, buy, full household workflow:
```bash
cd grocery-web && npx playwright test
```

## Docker

```bash
docker compose up -d
curl http://localhost:3060/health
# {"status":"ok","timestamp":"..."}
```

## The Guide

Every file in this project is explained line-by-line in a 5,400-line teaching guide. Three principles run through it:

1. **Every line has a reason.** No boilerplate, no "just because." If you can't explain why a line exists, delete it.
2. **Read the error, trust the error.** Every error has a code, message, and details. Debugging is reading, not guessing.
3. **Ship it, then perfect it.** Build it working first. Then make it right.

Read the guide: [Building Microservices Full-Stack: From Zero to Production](https://github.com/GX-Coin-Protocol/backend-core/blob/dev/docs/lectures/building-microservices-fullstack.md)

## License

MIT

## Author

Manazir Ali — Full-Stack Software Engineer
