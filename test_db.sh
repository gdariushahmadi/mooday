#!/bin/bash
pnpm run supabase:stop
pnpm run supabase:start
npx supabase test db
