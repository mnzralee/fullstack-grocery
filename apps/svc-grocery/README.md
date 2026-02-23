# svc-grocery

The backend microservice. Express, TypeScript, Clean Architecture. Handles grocery list management, item state machine, budget enforcement, and authentication.

## Layers

```
src/
├── domain/           Pure business rules. Zero external dependencies.
│   ├── errors/       DomainError base class + 5 specific errors
│   ├── value-objects/ Money (cents, no floats) + ItemStatus state machine
│   └── __tests__/    Unit tests for errors and Money
├── application/      Use cases and contracts. No HTTP, no database.
│   ├── use-cases/    CreateItem, ApproveItem, MarkBought, GetListWithBudget
│   ├── dto/          Request schemas (Zod) + response shapes
│   ├── ports/        Repository interfaces (what, not how)
│   └── __tests__/    Use case tests with mocked repositories
├── infrastructure/   Database access. Implements the ports.
│   └── repositories/ PrismaGroceryItemRepository, PrismaGroceryListRepository
├── interface/        HTTP layer. Translates requests to use case calls.
│   ├── controllers/  GroceryController (extract → execute → respond)
│   ├── routes/       Express routers (grocery + auth)
│   └── middlewares/  Auth (JWT), validation (Zod), error handler
└── shared/di/        Manual DI container. No framework, no decorators.
```

Dependencies point inward. The domain doesn't import Express. Use cases don't import Prisma. The controller doesn't contain business logic.

## Running

```bash
# Requires DATABASE_URL and JWT_SECRET (or use defaults)
npm run dev        # tsx watch, port 3060
npm run build      # tsc → dist/
npm run start      # node dist/index.js
npm run test       # vitest (10 tests)
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | No | `dev-secret-change-in-production-please` | JWT signing key (min 16 chars) |
| `PORT` | No | `3060` | Server port |
| `NODE_ENV` | No | `development` | Environment |

Config is validated at startup with Zod. Missing `DATABASE_URL`? The service prints the error and exits. No silent failures.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | — | Returns `{ status: "ok" }` |
| `POST` | `/api/v1/auth/login` | — | Email + password → JWT |
| `GET` | `/api/v1/grocery/lists/:listId` | Bearer | Items grouped by status + budget |
| `POST` | `/api/v1/grocery/lists/:listId/items` | Member+ | Create item (PENDING) |
| `POST` | `/api/v1/grocery/items/:itemId/approve` | Manager | APPROVE or REJECT |
| `POST` | `/api/v1/grocery/items/:itemId/buy` | Member+ | Mark bought, deduct budget |

## State Machine

```
PENDING ──→ APPROVED ──→ BOUGHT ──→ ARCHIVED
   │
   └──→ REJECTED (terminal)
```

Invalid transitions throw `InvalidItemStateError` with the current status, attempted target, and operation. The state machine is in `domain/value-objects/item-status.ts` — 21 lines, no magic.

## Tests

```bash
npx vitest run
```

10 tests across domain and application layers:
- `errors.test.ts` — DomainError hierarchy, error codes, HTTP status mapping
- `money.test.ts` — Cents arithmetic, negative prevention, display formatting
- `create-item.test.ts` — Use case with mocked repositories, validation, edge cases

## Docker

```bash
# From the monorepo root
docker compose build
docker compose up svc-grocery
```

Multi-stage Dockerfile: deps → build → production. The production image has no TypeScript, no dev dependencies, no build tools.
