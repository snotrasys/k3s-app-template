### Stage 1: install
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund --omit=dev

### Stage 2: runtime
FROM node:24-alpine
WORKDIR /app

ARG COMMIT_SHA=dev
ARG BUILT_AT=dev
ENV COMMIT_SHA=$COMMIT_SHA
ENV BUILT_AT=$BUILT_AT
ENV APP_NAME=k3s-app-template
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

EXPOSE 3000
USER node
CMD ["node", "src/server.js"]
