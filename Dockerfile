# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-slim AS build

ENV HUSKY=0
ENV npm_config_store_dir=/pnpm/store

RUN corepack enable

WORKDIR /app

COPY . .

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

RUN pnpm build

FROM build AS server

USER node

WORKDIR /app/packages/server

CMD ["node", "dist/src/main.js"]

FROM build AS shell

ENV PATH="/app/packages/shell/node_modules/.bin:${PATH}"

USER node

WORKDIR /app/packages/shell

CMD ["node", "scripts/start.mjs"]

FROM build AS user-administrator

ENV PATH="/app/packages/user-administrator/node_modules/.bin:${PATH}"

RUN mkdir -p /app/packages/user-administrator/node_modules/.vite-temp \
    && chown node /app/packages/user-administrator/node_modules/.vite-temp

USER node

WORKDIR /app/packages/user-administrator

CMD ["vite", "preview"]
