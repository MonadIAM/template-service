# syntax=docker/dockerfile:1.6

# --- Stage 1: Build ---
ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder

WORKDIR /app

COPY package*.json .npmrc ./

RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .
RUN npm run build

# --- Stage 2: Runtime ---
FROM ${BASE_IMAGE} AS runner

WORKDIR /app

COPY package*.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 5003
CMD ["node", "dist/src/main.js"]
