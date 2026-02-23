# Neighborhood Grocery List

A full-stack application where families manage a shared grocery list with budget tracking, role-based access, and state machine workflows. Built as a companion project for the guide *Building Microservices Full-Stack: From Zero to Production*.

```
┌──────────────┐     ┌──────────────┐     ┌────────────────┐     ┌───────────────┐
│   Browser    │────>│  Next.js App │────>│  Express API   │────>│  PostgreSQL   │
│  (React UI)  │<────│  (BFF Layer) │<────│  (Microservice)│<────│  (Database)   │
└──────────────┘     └──────────────┘     └────────────────┘     └───────────────┘
  Port 3000            Port 3000/api         Port 3060
```

## Tech Stack

**Backend**: Express.js, TypeScript, Zod, Prisma, JWT, bcryptjs
**Frontend**: Next.js 15, React 19, TanStack Query, React Hook Form, Tailwind CSS
**Database**: PostgreSQL 16, Prisma ORM with multi-file schema
**Deployment**: Docker (multi-stage), Docker Compose, Kubernetes manifests
**Architecture**: Clean Architecture (Domain, Application, Infrastructure, Interface layers)

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16 (or Docker)

### 1. Start PostgreSQL

```bash
docker run -d \
  --name grocery-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=grocery_db \
  -p 5432:5432 \
  postgres:16
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up the Database

```bash
cd packages/core-db
npx prisma generate
npx prisma db push
npx prisma db seed
```

The seed script prints the **List ID** -- copy it for step 5.

### 4. Start the Backend

```bash
cd apps/svc-grocery
npm run dev
# svc-grocery listening on port 3060
```

### 5. Start the Frontend

```bash
cd grocery-web
npm install
npm run dev
# Open http://localhost:3000/grocery/YOUR_LIST_ID
```

### 6. Test Credentials

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Manager | manager@grocery.test   | grocery123  |
| Member  | member@grocery.test    | grocery123  |

## API Endpoints

| Method | Endpoint                                  | Auth     | Description              |
|--------|-------------------------------------------|----------|--------------------------|
| GET    | /health                                   | None     | Health check             |
| POST   | /api/v1/auth/login                        | None     | Login, returns JWT       |
| GET    | /api/v1/grocery/lists/:listId             | Bearer   | Get items + budget       |
| POST   | /api/v1/grocery/lists/:listId/items       | Member+  | Create grocery item      |
| POST   | /api/v1/grocery/items/:itemId/approve     | Manager  | Approve or reject item   |
| POST   | /api/v1/grocery/items/:itemId/buy         | Member+  | Mark item as bought      |

## Project Structure

```
grocery-app/
├── apps/
│   └── svc-grocery/           # Express microservice
│       └── src/
│           ├── domain/        # Errors, value objects (no deps)
│           ├── application/   # Use cases, DTOs, ports
│           ├── infrastructure/# Prisma repositories
│           ├── interface/     # Controllers, routes, middleware
│           └── shared/di/     # Dependency injection container
├── packages/
│   └── core-db/               # Prisma schema + singleton client
├── grocery-web/               # Next.js frontend
│   └── src/
│       ├── app/               # Pages + BFF API routes
│       ├── components/        # React components
│       └── lib/               # API client, hooks, query keys
├── k8s/                       # Kubernetes manifests
├── docker-compose.yml
└── README.md
```

## Running Tests

```bash
cd apps/svc-grocery
npx vitest run
```

## Docker

```bash
docker compose build
docker compose up -d
curl http://localhost:3060/health
```

## License

MIT

## Author

Manazir Ali -- Full-Stack Software Engineer
