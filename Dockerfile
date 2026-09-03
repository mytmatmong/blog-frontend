# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-bookworm-slim

########################################################################
# Stage: dependencies — cài đầy đủ dependency (kể cả dev) để build
########################################################################
FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

########################################################################
# Stage: build — ng build (SSR + prerender)
########################################################################
FROM dependencies AS build
WORKDIR /app

COPY . .
RUN npm run build

# Cắt dev dependency, chỉ giữ production dependency (express, @angular/ssr...).
RUN npm prune --omit=dev

########################################################################
# Stage: production — chạy Node Express server (Angular SSR)
########################################################################
FROM node:${NODE_VERSION} AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

USER node

EXPOSE 4000

CMD ["node", "dist/blog-frontend/server/server.mjs"]
