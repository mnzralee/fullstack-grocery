# grocery-web

The frontend. Next.js 15, React 19, TanStack Query, Tailwind CSS. Talks to the backend through a BFF (Backend-for-Frontend) layer — the browser never sees the Express API directly.

## How It Works

```
Browser                    Next.js Server              Express Backend
   │                            │                            │
   │  fetch('/api/grocery/..') │                            │
   │──────────────────────────→│                            │
   │                            │  Read auth-token cookie   │
   │                            │  Add Authorization header │
   │                            │  POST localhost:3060/...  │
   │                            │───────────────────────────→│
   │                            │←───────────────────────────│
   │←──────────────────────────│                            │
   │  TanStack Query caches    │                            │
   │  React re-renders         │                            │
```

The BFF reads the JWT from an HTTP-only cookie (JavaScript can't touch it — XSS protection), forwards it as a Bearer token to the backend, and returns the response. The browser never knows the backend's address, port, or API structure.

## Structure

```
src/
├── app/
│   ├── login/page.tsx              Login form → /api/auth/login → redirect
│   ├── grocery/[listId]/page.tsx   Main grocery list page
│   ├── page.tsx                    Home → redirects to /login
│   ├── layout.tsx                  Root layout with Inter font
│   ├── providers.tsx               TanStack Query provider (client boundary)
│   └── api/                        BFF routes (server-side)
│       ├── auth/login/route.ts     Login → set HTTP-only cookie
│       └── grocery/items/
│           ├── route.ts            GET list, POST new item
│           └── [itemId]/
│               ├── approve/route.ts  Approve/reject
│               └── buy/route.ts      Mark bought
├── components/
│   ├── grocery/                    BudgetBar, GroceryItemCard, ItemList
│   ├── forms/                      AddItemForm (React Hook Form + Zod)
│   └── ui/                         Badge, Button (reusable primitives)
├── lib/
│   ├── backendClient.ts            Axios client + getAuthHeaders + error helper
│   ├── apiClient.ts                Browser-side fetch wrapper
│   ├── queryClient.ts              Query key factory
│   └── hooks/useGrocery.ts         useGroceryList, useCreateItem, useApproveItem, useMarkBought
└── types/grocery.ts                Shared TypeScript types
```

## Running

```bash
npm install
npm run dev       # Next.js dev server, port 3000
npm run build     # Production build
npm run start     # Production server
```

Requires the backend running on port 3060. Set `BACKEND_URL` to override.

## E2E Tests

13 Playwright tests covering the full user journey:

```bash
npx playwright test
```

| Suite | Tests | What it covers |
|-------|-------|----------------|
| Login Flow | 5 | Login page, redirect, manager/member login, invalid credentials |
| Grocery List View | 4 | Items grouped by status, budget display, action buttons |
| Add Item Flow | 1 | Form fill → item appears in Pending |
| Approve Flow | 1 | Click Approve → APPROVED badge |
| Mark Bought Flow | 1 | Click Mark Bought → BOUGHT badge + "Paid:" text |
| Full Household Workflow | 1 | Member adds → Manager approves → Member buys (multi-page) |

Tests run headless in Chromium. Screenshots captured on every test.

## Key Patterns

**TanStack Query for server state.** No `useState` + `useEffect` + `fetch`. The `useGroceryList` hook fetches, caches, deduplicates, and refetches. Mutations invalidate the cache automatically.

**React Hook Form + Zod for forms.** The AddItemForm schema validates on the client. The same Zod schemas validate on the backend. Same rules, same messages, both sides.

**BFF for security.** The JWT never touches `localStorage` or `document.cookie`. It lives in an HTTP-only cookie that only the Next.js server can read. The browser sends relative URLs (`/api/grocery/items`), the BFF forwards them with the token attached.
