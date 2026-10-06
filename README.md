# PMHCOSMETICS: Cosmetics E-Commerce Platform

Next.js 15 · React 19 · TypeScript · Tailwind · PostgreSQL · Paystack + Flutterwave · TOTP-protected admin

**Status:** complete feature set, written without the ability to install or run it. Expect a few small
type/runtime fixes on first run. Start with `npm install && npm run typecheck`.

## Setup
1. `npm install`
2. `cp .env.example .env`, then fill in (see below).
3. `npm run db:migrate`
4. `npm run admin:seed` (creates your Super Admin and prints a one-time 2FA key), then delete `SEED_ADMIN_PASSWORD` from `.env`
5. `npm run data:seed` (optional demo catalogue + `BEAUTY10` code)
6. `npm run dev`: storefront http://localhost:3000, admin http://admin.localhost:3000

Generate secrets (works in PowerShell, macOS, Linux):
`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

## Environment
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `APP_URL`, `ADMIN_URL` | Public origins; the admin host must differ (e.g. `admin.yourdomain.com`) |
| `TOTP_ENCRYPTION_KEY` | Encrypts admin 2FA secrets and signs guest order links. Never change it once admins exist. |
| `DEV_AUTO_VERIFY_EMAIL` | `true` skips email verification in development only |
| `RESEND_API_KEY`, `EMAIL_FROM` | Email. Empty key = emails are printed to the console |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_HASH` | Flutterwave v3 secret key + the secret hash you set in their dashboard |
| `S3_*` | Any S3-compatible bucket (R2, S3, B2) for product images. Enable CORS for PUT from your admin origin |
| `CRON_SECRET` | Protects the stock-release job |

## Payments
Customer → `POST /api/checkout` (prices recomputed server-side from the DB; stock reserved in a transaction) →
gateway hosted page → return page calls `POST /api/payments/verify` **and** the gateway sends a webhook.
Both paths run the same `processPayment()`, which asks the gateway API for the truth, checks amount + currency,
and only then marks the order paid. A browser "success" alone never confirms anything. Idempotent.

Webhook URLs to register: `https://yourdomain.com/api/webhooks/paystack` and `/api/webhooks/flutterwave`.
Schedule `POST /api/cron/release-stock` (header `Authorization: Bearer $CRON_SECRET`) every 10 minutes to
free stock from abandoned checkouts.

## Layout
- `db/migrations`: schema (money in kobo, constraints, soft-delete products, append-only audit log)
- `src/server`: `auth/` sessions·RBAC·TOTP · `payments/` · `security/` · `catalog.ts` · `cart.ts` · `orders.ts` · `admin/`
- `src/app/(store)`: storefront + account · `(auth)`: login/signup/onboarding · `admin/`: admin panel · `api/`: all endpoints
- `src/components/ui`: Button, Input, Select, Checkbox, Radio, Tabs, Modal, Toast, Pagination, OrderStatus, PaymentSelector…
- `src/components/store`: Navbar, MobileBottomNav, ProductCard, CategoryCard, ProductGallery, WishlistButton, CartButton, SearchBar, FilterDrawer

## Security notes
Argon2id passwords · hashed, revocable sessions · admin: password → TOTP → session, lockout, role checks on every page and API ·
origin check on all mutations · DB-backed rate limits · audit log · webhook signature checks · no secrets in client code.
Admin separation is by host (middleware) **and** by server-side checks. The host split is routing, not the security boundary.

## Known gaps
- Flutterwave integration targets the v3 API (secret key). v4 (OAuth) needs changes in `payments/providers.ts`.
- TOTP codes aren't replay-blocked within their 30s window; no admin self-service password reset (a Super Admin recreates the account).
- No CSP header yet; `x-forwarded-for` is trusted (configure your proxy). Refunds are recorded here but issued in the gateway dashboard.
- Product photos are not included. Upload through Admin → Products.
- Privacy Policy and Terms are templates. Have them reviewed before launch.
- No automated tests.
