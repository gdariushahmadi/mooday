---
kind: external_dependency
name: Vercel as deployment target and legacy project name
slug: vercel
category: external_dependency
category_hints:
    - client_constraint
scope:
    - '**'
---

### Vercel
- Role: Hosting platform referenced by `.vercelignore` and the showcase's iframe URLs that still point at the legacy `mooday-ten.vercel.app` deployment domain; these URLs are intentionally left for the operator to update when re-deploying under the new `daneg` domain.
- Constraint: the app also supports standalone output (`output: 'standalone'` in `next.config.ts`) for cPanel/Passenger deployments, so Vercel is one of multiple targets rather than the only one.