# trove-web

See `package.json` for available scripts.

## Verification

After making changes, always verify before committing:

1. `pnpm lint` — check for lint errors
2. `pnpm format` — format code
3. `pnpm test:run` — run tests (prefer single test files when iterating)
4. `pnpm build` — catches type errors and build issues that lint alone won't find
5. If adding a feature or fixing a bug, write or update tests and confirm they pass.

Husky pre-commit runs all four steps. All must pass.

## Auto-Generated Files — DO NOT EDIT

- `src/api/generated/` — Orval output (hooks, types, Zod schemas, MSW mocks). Regenerate with `pnpm generate-api`.
- `src/routeTree.gen.ts` — TanStack Router route tree. Regenerate with `pnpm generate-routes`.

After adding or renaming route files in `src/routes/`, always run `pnpm generate-routes`.

## Key Patterns

- **Never use `fetch` directly.** Always use ky via React Query (`useQuery` for reads, `useMutation` for writes).
- **Client-side validation errors** should be separate `useState` — they're synchronous and not tied to the mutation lifecycle. Derive API errors from `mutation.isError`/`mutation.error`.
- **Routing:** File-based via TanStack Router. Dynamic segments use `$param` syntax (e.g., `items.$itemId.tsx`). `__root.tsx` is the root layout.
- **Auth:** httpOnly cookies (`credentials: "include"` on Ky client), NOT Authorization headers. Auto-refreshes on 401.
- **shadcn/ui:** Add components via `pnpm dlx shadcn@latest add <component>`. Don't write custom primitives when shadcn has one.

## Testing

- Use `renderWithFileRoutes()` from `@/test/renderers` — it sets up router, React Query, auth context, and theme.
- Vitest globals are enabled — no need to import `describe`, `it`, `expect`.
- MSW mocks API responses. Default: unauthenticated (401 on `/auth/me`). `renderWithFileRoutes` overrides to authenticated by default.

## Code Style

- Prettier: no semicolons, double quotes, Tailwind class sorting.
