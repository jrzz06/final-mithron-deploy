# Security

## Secrets and credentials

- Never commit `.env`, `.env.local`, or `.env.*` files. `.gitignore` excludes them.
- Use `.env.example` as the template for required variables only — no real values.
- **Production:** set secrets in your deployment platform (Vercel, Railway, etc.). The app calls `assertProductionRuntimeConfig()` at startup in production and will fail fast if required variables are missing.
- **Local development:** `.env.local` is for your machine only. Do not expose it over the network or copy it into production images.
- Rotate `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, payment keys, and other secrets immediately if they were ever committed to git.

### Supabase MCP / Personal Access Tokens

- Never commit [`.cursor/mcp.json`](.cursor/mcp.json). It is gitignored; use [`.cursor/mcp.json.example`](.cursor/mcp.json.example) as the template.
- If a Supabase PAT (`sbp_…`) is exposed (shared machine, screenshot, accidental commit), **revoke it immediately** in the Supabase dashboard and issue a new token.
- Do not store long-lived admin tokens beside application source code.

### Production environment

- Set all secrets in your deployment platform (Vercel, Railway, etc.). Do not ship `.env.local` in production images.
- If a workstation with `.env.local` is shared or compromised, rotate every secret in that file before deploying.
- `ALLOW_DEMO_SEED` must not be `true` in production (startup will fail).
- Cron/internal bearer secrets (`CRON_SECRET`, `NOTIFICATION_DISPATCH_SECRET`, `PAYMENT_EXPIRE_SECRET`, `HEALTH_CHECK_SECRET`) should be at least 32 cryptographically random bytes.

Verify `.env.local` is ignored:

```bash
npm run security:verify-secrets
```

Or manually:

```bash
git check-ignore -v .env.local
git log --all --full-history -- .env.local
```

## API route protection

Page routes (`/admin`, `/warehouse`, `/supplier`, `/account`, etc.) are RBAC-gated in `proxy.ts`.

**Every new `/api/*` route must enforce its own authentication and authorization.** Middleware does not protect API routes. Use:

- `createClient()` + `getClaims()` / `getUser()` for session auth
- `requirePermission()` for RBAC
- `safeBearerEquals()` for cron/internal bearer secrets
- `checkDistributedRateLimit()` for abuse-sensitive endpoints

## Service-role reads

`fetchAdminRecordsByColumn` bypasses RLS. Pass `requiredPermission` when calling it from user-facing code, or use an authenticated Supabase client for reads that should respect RLS.

Rotate `SUPABASE_SERVICE_ROLE_KEY` immediately if it was ever exposed (logs, client bundle, committed env file).

## Storage security

- Public Supabase storage buckets (`mithron-products`, `mithron-cms`, etc.) are intentionally world-readable for storefront media.
- Never upload sensitive documents to public buckets. Use `mithron-warehouse-documents` (private) for operational files.
- SVG uploads are blocked server-side in `assertAllowedMediaMimeType()`.

## Content Security Policy

- `style-src 'unsafe-inline'` is required for Tailwind utility classes (accepted risk).
- `img-src` is restricted to `'self'`, Supabase origin, Razorpay, `data:`, and `blob:` in production.

## Media routes

Mission image routes only serve allowlisted filenames from `public/media/...`. Dev-only Cursor asset fallbacks are disabled in production.
