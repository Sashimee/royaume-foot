# Build, then serve. Two stages, so the published image carries nginx and about
# twenty files rather than Node and four hundred packages.

# ---------------------------------------------------------------------------
# 1. Build
# ---------------------------------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /jeu

# Dependencies first, on their own: while package-lock.json is unchanged this
# layer is reused and the install does not repeat for every code change.
COPY package.json package-lock.json ./
# Playwright is a devDependency and its browser download is ~150 MB. The e2e
# suite runs in CI, on a runner that has a browser; it cannot run in here and
# must not try.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN npm ci

COPY . .

# Types and the rule set, before the build. An image that fails either must not
# be publishable — the difficulty harness in src/game/balance.test.ts is the
# one that matters, because it is what keeps the game kind.
RUN npm run lint && npm test && npm run build

# Precompress. The output is static and will not change again: compressing once
# here beats what nginx can do on the fly, and costs nothing per visit. The
# three.js chunk is 725 kB and gzips to 185 kB, which is the whole argument.
RUN apk add --no-cache brotli && \
    find dist -type f \( -name '*.html' -o -name '*.js' -o -name '*.css' -o -name '*.svg' -o -name '*.json' -o -name '*.webmanifest' \) \
      -exec gzip -9 -k {} \; -exec brotli -q 11 -k {} \;

# ---------------------------------------------------------------------------
# 2. Serve
# ---------------------------------------------------------------------------
FROM nginx:alpine AS serve

COPY --from=build /jeu/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx-headers.conf /etc/nginx/snippets/headers.conf

# Dokploy reads this to decide whether a deployment worked. Without it a broken
# container reports itself as a successful deploy.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

EXPOSE 80
