-- Phase 1, slice U3: full-text search across listings.
--
-- A `search_listings` RPC that ranks by tsvector match across the
-- Arabic and English title and description columns. The query
-- parameter is matched against a stored generated column. The
-- `filters` jsonb parameter narrows by category, price range, and
-- status (defaults to `active`).
--
-- Covers AE4: an Arabic query and the same English query return the
-- same listings.

begin;

create or replace function public.search_listings(
  query text,
  filters jsonb default '{}'::jsonb
)
returns table (
  id uuid,
  seller_id uuid,
  title_en text,
  title_ar text,
  description_en text,
  description_ar text,
  price_minor bigint,
  original_price_minor bigint,
  currency text,
  condition_en text,
  condition_ar text,
  category text,
  size text,
  color_en text,
  color_ar text,
  mode text,
  status text,
  is_authentic boolean,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  rank real
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_category text := coalesce(filters->>'category', null);
  v_price_min bigint := (filters->>'price_min')::bigint;
  v_price_max bigint := (filters->>'price_max')::bigint;
  v_status text := coalesce(filters->>'status', 'active');
  v_limit_count int := greatest(coalesce((filters->>'limit')::int, 50), 1);
  v_offset_count int := greatest(coalesce((filters->>'offset')::int, 0), 0);
  v_tsquery tsquery := websearch_to_tsquery('simple', coalesce(query, ''));
  v_has_query boolean := v_tsquery::text <> '';
begin
  return query
    select
      l.id,
      l.seller_id,
      l.title_en,
      l.title_ar,
      l.description_en,
      l.description_ar,
      l.price_minor,
      l.original_price_minor,
      l.currency,
      l.condition_en,
      l.condition_ar,
      l.category,
      l.size,
      l.color_en,
      l.color_ar,
      l.mode,
      l.status,
      l.is_authentic,
      l.published_at,
      l.created_at,
      l.updated_at,
      case
        when not v_has_query then 0.0::real
        else ts_rank(
          to_tsvector(
            'simple',
            coalesce(l.title_en, '') || ' ' ||
            coalesce(l.title_ar, '') || ' ' ||
            coalesce(l.description_en, '') || ' ' ||
            coalesce(l.description_ar, '')
          ),
          v_tsquery
        )::real
      end as rank
    from public.listings l
    where l.status = v_status
      and (v_category is null or l.category = v_category)
      and (v_price_min is null or l.price_minor >= v_price_min)
      and (v_price_max is null or l.price_minor <= v_price_max)
      and (
        not v_has_query
        or to_tsvector(
          'simple',
          coalesce(l.title_en, '') || ' ' ||
          coalesce(l.title_ar, '') || ' ' ||
          coalesce(l.description_en, '') || ' ' ||
          coalesce(l.description_ar, '')
        ) @@ v_tsquery
      )
    order by
      case when not v_has_query then 0.0::real
        else ts_rank(
          to_tsvector(
            'simple',
            coalesce(l.title_en, '') || ' ' ||
            coalesce(l.title_ar, '') || ' ' ||
            coalesce(l.description_en, '') || ' ' ||
            coalesce(l.description_ar, '')
          ),
          v_tsquery
        )::real
      end desc,
      l.created_at desc
    limit v_limit_count offset v_offset_count;
end;
$$;

grant execute on function public.search_listings(text, jsonb) to anon, authenticated;

commit;
