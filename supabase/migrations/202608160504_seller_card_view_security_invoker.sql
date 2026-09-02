-- Repair: pin `public.seller_card_view` to SECURITY INVOKER.
--
-- The Supabase linter flagged this view as SECURITY DEFINER. The view
-- is granted to `anon` and joins `public.listings`. With DEFINER
-- semantics the join runs as the view owner and bypasses the listings
-- RLS policy (`status = 'active' or seller_id = auth.uid()`), leaking
-- drafts, reserved, sold, and archived listings to unauthenticated
-- callers browsing the public seller card.
--
-- The original `create or replace view public.seller_card_view` in
-- phase_3_public_seller_profiles.sql did not pin a security context.
-- PostgreSQL's `CREATE OR REPLACE VIEW` preserves the original view's
-- security context, so any environment where the view was first
-- installed with DEFINER (manual creation in production, for example)
-- keeps DEFINER through every subsequent `CREATE OR REPLACE`.
--
-- This migration is idempotent. Re-running it on a view that already
-- has `security_invoker=on` is a no-op. The companion migration
-- (phase_3_public_seller_profiles.sql) now declares the property
-- explicitly so future `CREATE OR REPLACE VIEW` calls reset to
-- INVOKER rather than preserving the legacy context.

begin;

alter view public.seller_card_view set (security_invoker = on);

commit;
