FROM node:20-alpine AS builder

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

ARG VITE_API_BASE_URL
ARG VITE_API_BASE_PORT
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_BASE_PORT=$VITE_API_BASE_PORT

RUN pnpm --filter ui build

FROM node:20-alpine AS runner

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production

RUN corepack enable
WORKDIR /app

COPY --from=builder /app /app

EXPOSE 4173

CMD ["pnpm", "--filter", "ui", "preview", "--host", "0.0.0.0", "--port", "4173"]
