import path from "path"
import { sentryVitePlugin } from "@sentry/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

/**
 * Release identifier baked into the bundle as Sentry's `release` tag. The
 * deploy workflow passes the commit SHA; "dev" locally, which keeps a
 * developer's events from being attributed to whatever shipped last.
 */
const releaseSha = process.env.VITE_RELEASE_SHA || "dev"

/**
 * Source-map upload runs only when all three variables are present, so the
 * runtime integration works on its own and readable stack traces can be
 * switched on later by setting them — no code change here.
 *
 * SENTRY_AUTH_TOKEN is a real secret, unlike the DSN. The Dockerfile takes it
 * as a BuildKit secret mount rather than a build arg so it never lands in a
 * committed image layer.
 */
/**
 * Repository as named in Sentry, e.g. "owner/name". Supplied by the deploy
 * workflow from GITHUB_REPOSITORY rather than hardcoded, and absent locally —
 * where commit association is neither possible nor wanted.
 */
const releaseRepo = process.env.SENTRY_RELEASE_REPO

const sentryUpload =
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT
    ? {
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
      }
    : null

export default defineConfig({
  define: {
    __APP_RELEASE__: JSON.stringify(releaseSha),
  },
  build: {
    // ONLY WHEN THEY WILL BE UPLOADED AND THEN DELETED. The plugin removes the
    // .map files once Sentry has them, but that cleanup is part of the plugin
    // — so emitting them unconditionally would leave them in dist/ on any
    // build without a token, and nginx serves dist/ verbatim. That publishes
    // the entire readable source to anyone who appends ".map" to a bundle URL.
    // Tying the two together makes the unsafe combination unrepresentable.
    sourcemap: Boolean(sentryUpload),
  },
  plugins: [
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    ...(sentryUpload
      ? [
          sentryVitePlugin({
            ...sentryUpload,
            release: {
              name: releaseSha,
              // Associates commits between this release and the previous one
              // so Sentry can point at a suspect commit for a new error.
              //
              // NAMED REPO AND COMMIT, NOT `auto`. `auto` reads the local git
              // history, and there is none to read: .dockerignore excludes
              // .git deliberately, so the build container holds the source
              // without the repository. It failed every deploy with "could not
              // find repository at '.'" while source maps uploaded fine either
              // side of it. Naming the repo and commit instead has Sentry
              // resolve the range server-side from the linked GitHub
              // integration, which needs no git in the image.
              //
              // previousCommit is left out on purpose: Sentry defaults it to
              // the last commit of the previous release, which is more correct
              // than anything this build could work out on its own.
              ...(releaseRepo
                ? {
                    setCommits: {
                      repo: releaseRepo,
                      commit: releaseSha,
                      ignoreMissing: true,
                    },
                  }
                : {}),
            },
            sourcemaps: {
              // Upload, then remove. Without this the .map files ship inside
              // the image and nginx hands the entire source tree to anyone
              // who asks for it.
              filesToDeleteAfterUpload: ["./dist/**/*.map"],
            },
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
