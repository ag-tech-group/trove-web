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

# An unset value is not an error: analytics.ts and error-monitoring.ts each
# skip initialising their SDK entirely when the matching variable is empty, so
# a build without these produces a working image with that feature switched
# off rather than a broken one. Vite also drops the SDK from the bundle.
ARG VITE_SENTRY_DSN
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ARG VITE_POSTHOG_KEY
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST

# The commit this image is built from. Baked in as Sentry's release tag so an
# error resolves against the source maps uploaded for the same SHA.
ARG VITE_RELEASE_SHA
ENV VITE_RELEASE_SHA=$VITE_RELEASE_SHA

# Which Sentry project receives the source maps. Not VITE_-prefixed and so not
# compiled into the bundle — read by the build, then discarded with this stage.
ARG SENTRY_ORG
ENV SENTRY_ORG=$SENTRY_ORG
ARG SENTRY_PROJECT
ENV SENTRY_PROJECT=$SENTRY_PROJECT

# Repository as named in Sentry, so releases can be tied to commits without a
# git history to read — .dockerignore keeps .git out of this image on purpose.
ARG SENTRY_RELEASE_REPO
ENV SENTRY_RELEASE_REPO=$SENTRY_RELEASE_REPO

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

# THE SENTRY TOKEN IS A SECRET MOUNT, NOT A BUILD ARG. Unlike the DSN — which
# is public and ships in the bundle by design — an auth token can write to the
# Sentry org. A build arg is recorded in the image and stays readable through
# `docker history` for the life of that image; a secret mount exists only for
# the duration of this RUN and leaves no layer behind. Do not "simplify" it
# into an ARG.
#
# Absent or empty, vite.config.ts simply skips the upload and the build still
# succeeds — errors then report with minified stacks rather than failing.
#
# `pnpm build` is generate-routes && tsc -b && vite build — the same command CI
# runs, so a build that fails here fails there too rather than only in the image.
RUN --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || true)" \
    pnpm build

# ── serve ─────────────────────────────────────────────────────────────────────
FROM nginx:alpine AS serve

# A TEMPLATE, NOT A FINISHED CONFIG. The entrypoint substitutes
# ${NGINX_LOCAL_RESOLVERS} — read from the platform's /etc/resolv.conf — into
# the PostHog relay's `resolver` directive, so the proxy uses whatever DNS the
# runtime actually provides instead of a hardcoded address that is wrong
# somewhere. The FILTER narrows substitution to that one variable so nginx's
# own $uri, $posthog_ingest and friends survive envsubst untouched.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
ENV NGINX_ENVSUBST_FILTER=^NGINX_LOCAL_RESOLVERS
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Cloud Run routes to $PORT, which defaults to 8080 and is what the service
# declares as this container's port. nginx's own default is 80, so the config
# listens on 8080 and all three have to agree.
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
