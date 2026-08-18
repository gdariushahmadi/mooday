# Affiliate Redirect Service-Role Use

The `/go/[shortId]` route handler uses the Supabase service-role key
to read the active `affiliate_links` row and to insert a row into
`affiliate_clicks`. This document records why the service role is
needed and where it is allowed.

## Why service role

The `affiliate_clicks` table has `insert` open to `anon` and
`authenticated` (so logged-out visitors can be tracked) but its
`select` policy is admin-only. The redirect itself must resolve the
short_id without an authenticated session and without an admin JWT,
because the visitor's first click may come from an anonymous browser.
The browser-publishable Supabase client can write to `affiliate_clicks`
but cannot look up the partner-side URL (RLS denies anon `select` on
`affiliate_links` would also block this; even without that, we want
the canonical URL stored server-side, not shipped to the client).

The service-role client is the third sanctioned server-side use of
that key in this codebase. The full list is:

1. `src/app/api/stripe/webhook/route.ts` - Stripe webhook signature
   verification (cannot run under the user's browser-publishable JWT).
2. `src/app/api/health/route.ts` - health-check Supabase ping (no user
   context).
3. `src/app/go/[shortId]/route.ts` - this redirect handler.

## Audit

```bash
rg -n "createClient.*service.role|serviceRoleKey" src/
```

Any new service-role use MUST be added to this list and reviewed by
the next code-review pass.

## Cookie

The handler sets a first-party `m_aff_anon` cookie (UUIDv4, 1-year
lifetime, `SameSite=Lax`) on the first visit from each browser. The
cookie carries no PII and is used solely to attribute multiple clicks
from the same browser to the same anonymous user.

## Failure modes

- Lookup miss or inactive link: 404. The visitor lands on a 404 page
  (no redirect; admin can verify the link and the visitor's UX is
  honest).
- Click insert failure: the click is logged to Sentry via
  `Sentry.captureException`, and the visitor is 302-redirected to
  the partner URL anyway. We never trap a visitor on a blank page
  because the analytics insert failed.
- Service-role client creation failure (missing env var): the visitor
  is 302-redirected to `/app` (the closest safe fallback URL).
