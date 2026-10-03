# syntax=docker/dockerfile:1.7
# Container images of the site. Two targets share one build:
#   runner — the self-contained Next.js server with the CMS, as small as the trace allows;
#   tools  — the workspace with its dependencies for one-off jobs: migrations, seed, demo reset.

ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    FONTCONFIG_FILE=/app/apps/web/assets/fonts/fonts.conf
RUN corepack enable
WORKDIR /app

# Dependencies: only manifests and the lockfile, so the layer survives source changes.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/configurator/package.json packages/configurator/
COPY packages/house/package.json packages/house/
COPY packages/pricing/package.json packages/pricing/
RUN --mount=type=cache,id=kedrovnik-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
# The build validates the environment schema but connects to nothing: placeholders suffice,
# every real value comes from the container's environment at runtime.
RUN NEXT_OUTPUT=standalone \
    DATABASE_URL=postgres://build:build@127.0.0.1:5432/build \
    PAYLOAD_SECRET=build-time-placeholder-not-used-at-runtime-000000 \
    SITE_URL=http://localhost:3000 \
    MAIL_FROM_ADDRESS=build@localhost.localdomain \
    MAIL_FROM_NAME=build \
    pnpm --filter @kedrovnik/web build

FROM base AS runner
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
# The standalone trace keeps the monorepo layout; the server runs from the app's folder, where
# uploads, proposals and demo mail live (mounted volumes) next to the fonts and seed renders.
COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /app/apps/web/public ./apps/web/public
COPY --chown=node:node apps/web/assets/fonts ./apps/web/assets/fonts
COPY --chown=node:node apps/web/seed-assets ./apps/web/seed-assets
RUN mkdir -p apps/web/media apps/web/documents apps/web/mailbox-files \
 && chown node:node apps/web/media apps/web/documents apps/web/mailbox-files
USER node
WORKDIR /app/apps/web
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "server.js"]

FROM deps AS tools
ENV NODE_ENV=production
COPY --chown=node:node . .
RUN mkdir -p apps/web/media apps/web/documents apps/web/mailbox-files \
 && chown node:node apps/web apps/web/media apps/web/documents apps/web/mailbox-files
USER node
WORKDIR /app/apps/web
# The Payload CLI of the app: `migrate` by default; `run src/seed/run.ts` seeds a demo stand.
ENTRYPOINT ["/app/apps/web/node_modules/.bin/payload"]
CMD ["migrate"]
