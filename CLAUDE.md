@AGENTS.md

# Godavari Kart storefront + admin (Next.js 16, React 19, MUI 9)

Read `../docs/architecture.md` and `../docs/api.md` first.

## Rules
- Colors live only in `src/theme/colors.ts`; components use palette keys (`primary.main`, `text.secondary`). ESLint fails on hex/rgb literals elsewhere.
- All HTTP goes through `src/services/api/http.ts`; endpoint functions live in `src/services/<domain>/`. No `fetch` in components.
- Server Components by default. Client Components only for interaction. Server Components must not pass functions to client components (use `LinkButton`, not `<Button component={NextLink}>`).
- MUI v9: no system props, no `InputProps`/`inputProps` — use `sx` and `slotProps`.
- Every list is paginated (API max 100 per page).
- Internal URLs come from `src/config/routes.ts`.
- The access token stays in memory (`token-store.ts`); never persist it.

## Commands
`npm run dev` · `npm run lint` · `npm run typecheck` · `npm run build`
