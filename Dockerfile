# ---- Stage 1: install dependencies (cached while package files are unchanged) ----
FROM node:24-alpine AS deps
WORKDIR /app
# Cypress is only needed for local E2E runs; skip its large binary download in images
ENV CYPRESS_INSTALL_BINARY=0
COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: build the static frontend ----
FROM deps AS build
# Vite inlines VITE_* variables at build time, so the WebSocket URL is a build arg
ARG VITE_WS_URL=ws://localhost:3001
ENV VITE_WS_URL=$VITE_WS_URL
COPY . .
RUN npm run build

# ---- Target: frontend, static files served by nginx on port 3000 ----
FROM nginx:alpine AS frontend
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000

# ---- Target: mock WebSocket server (express + ws, run with tsx) ----
FROM deps AS server
COPY tsconfig*.json ./
COPY src ./src
EXPOSE 3001
# Run node directly (not via npm) so SIGTERM from `docker stop` reaches the process
CMD ["node_modules/.bin/tsx", "src/services/mockServer/server.ts"]
