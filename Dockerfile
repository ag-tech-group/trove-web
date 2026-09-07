# syntax=docker/dockerfile:1

# ── build ─────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS build

# VITE_* VARIABLES ARE BAKED IN AT BUILD TIME AND NEVER READ AT RUNTIME. Vite
# substitutes them into the bundle during `vite build`, so this has to be a build
# arg: setting VITE_API_URL as a Cloud Run environment variable does nothing at
# all, because by then the value is already compiled into the JavaScript.
#
# The consequence worth knowing before the domain cutover: pointing the frontend
# at a different API means a REBUILD and a new image, not a service update.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

# Pinned to the major CI uses. package.json declares no packageManager field, so
# corepack has nothing to infer from and would otherwise pick its own default.
RUN corepack enable && corepack prepare pnpm@10 --activate

# Manifest and lockfile before the source, so editing a component does not
# invalidate the install layer. --frozen-lockfile fails on a lockfile that does
# not match package.json rather than quietly resolving something newer than what
# CI tested.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# `pnpm build` is generate-routes && tsc -b && vite build — the same command CI
# runs, so a build that fails here fails there too rather than only in the image.
RUN pnpm build

# ── serve ─────────────────────────────────────────────────────────────────────
FROM nginx:alpine AS serve

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Cloud Run routes to $PORT, which defaults to 8080 and is what the service
# declares as this container's port. nginx's own default is 80, so nginx.conf
# listens on 8080 and all three have to agree.
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
