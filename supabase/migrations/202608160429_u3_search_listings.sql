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
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select
      coalesce(filters->>'category', null) as category,
      (filters->>'price_min')::bigint as price_min,
      (filters->>'price_max')::bigint as price_max,
      coalesce(filters->>'status', 'active') as status,
      (filters->>'limit')::int as limit_count,
      (filters->>'offset')::int as offset_count
  ),
  q as (
    select
      websearch_to_tsquery('simple', coalesce(query, '')) as tsq
  )
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
      when q.tsq = ''::tsvector then 0.0::real
      else ts_rank(
        to_tsvector(
          'simple',
          coalesce(l.title_en, '') || ' ' ||
          coalesce(l.title_ar, '') || ' ' ||
          coalesce(l.description_en, '') || ' ' ||
          coalesce(l.description_ar, '')
        ),
        q.tsq
      )::real
    end as rank
  from public.listings l
  cross join q
  cross join params p
  where l.status = p.status
    and (p.category is null or l.category = p.category)
    and (p.price_min is null or l.price_minor >= p.price_min)
    and (p.price_max is null or l.price_minor <= p.price_max)
    and (
      q.tsq = ''::tsvector
      or to_tsvector(
        'simple',
        coalesce(l.title_en, '') || ' ' ||
        coalesce(l.title_ar, '') || ' ' ||
        coalesce(l.description_en, '') || ' ' ||
        coalesce(l.description_ar, '')
      ) @@ q.tsq
    )
  order by rank desc, l.created_at desc
  limit greatest(coalesce(p.limit_count, 50), 1)
  offset greatest(coalesce(p.offset_count, 0), 0);
$$;

grant execute on function public.search_listings(text, jsonb) to anon, authenticated;

commit;
