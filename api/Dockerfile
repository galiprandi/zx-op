FROM node:20-slim AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/package.json
COPY ui/package.json ./ui/package.json
COPY shared/package.json ./shared/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter api db:generate
RUN pnpm --filter api build

FROM node:20-slim AS runner

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production

RUN corepack enable
WORKDIR /app

COPY --from=builder /app /app

EXPOSE 3000

CMD ["pnpm", "--filter", "api", "start"]
