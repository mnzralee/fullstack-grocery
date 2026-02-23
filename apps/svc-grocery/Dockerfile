# ============================================================
# Stage 1: Dependencies
# Install all node_modules (including devDependencies for build)
# ============================================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files for all workspaces
COPY package.json package-lock.json ./
COPY apps/svc-grocery/package.json ./apps/svc-grocery/
COPY packages/core-db/package.json ./packages/core-db/

RUN npm ci --workspace=apps/svc-grocery --workspace=packages/core-db

# ============================================================
# Stage 2: Build
# Compile TypeScript to JavaScript
# ============================================================
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/svc-grocery/node_modules ./apps/svc-grocery/node_modules
COPY --from=deps /app/packages/core-db/node_modules ./packages/core-db/node_modules

# Copy source code
COPY packages/core-db ./packages/core-db
COPY apps/svc-grocery ./apps/svc-grocery
COPY tsconfig.json ./

# Generate Prisma client
RUN cd packages/core-db && npx prisma generate

# Build TypeScript
RUN cd apps/svc-grocery && npx tsc

# ============================================================
# Stage 3: Production
# Only the compiled code and production dependencies
# ============================================================
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy only what we need to run
COPY --from=build /app/apps/svc-grocery/dist ./apps/svc-grocery/dist
COPY --from=build /app/apps/svc-grocery/package.json ./apps/svc-grocery/
COPY --from=build /app/packages/core-db ./packages/core-db
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3060

CMD ["node", "apps/svc-grocery/dist/index.js"]
