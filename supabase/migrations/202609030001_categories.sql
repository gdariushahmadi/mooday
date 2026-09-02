-- Product categories: admin-managed, dynamic replacement for the hardcoded
-- CATEGORIES list in src/data/categories.ts. Listings still store category
-- as free text (see 202607150002_phase_3_listings.sql); this table is the
-- curated picker/filter source, not an FK target.
begin;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name_en text not null check (length(trim(name_en)) between 1 and 80),
  name_ar text not null check (length(trim(name_ar)) between 1 and 80),
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index categories_active_order_idx
  on public.categories(is_active, sort_order, slug);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
grant select on table public.categories to anon, authenticated;
revoke insert, update, delete on table public.categories from anon, authenticated;

create policy "categories_select_all"
  on public.categories for select to anon, authenticated
  using (true);

create policy "categories_insert_admin"
  on public.categories for insert to authenticated
  with check ((select is_admin from public.profiles p where p.id = auth.uid()));

create policy "categories_update_admin"
  on public.categories for update to authenticated
  using ((select is_admin from public.profiles p where p.id = auth.uid()))
  with check ((select is_admin from public.profiles p where p.id = auth.uid()));

create policy "categories_delete_admin"
  on public.categories for delete to authenticated
  using ((select is_admin from public.profiles p where p.id = auth.uid()));

grant insert, update, delete on table public.categories to authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.categories to service_role;

-- Seed from the existing static list (src/data/categories.ts), excluding
-- the synthetic "All" filter option.
insert into public.categories (slug, name_en, name_ar, sort_order) values
  ('dresses', 'Dresses', 'فساتين', 1),
  ('shoes', 'Shoes', 'أحذية', 2),
  ('bags', 'Bags', 'حقائب', 3),
  ('accessories', 'Accessories', 'إكسسوارات', 4),
  ('clothing', 'Clothing', 'ملابس', 5)
on conflict (slug) do nothing;

-- Audit log needs a target kind for category CRUD actions.
alter table public.audit_log drop constraint audit_log_target_kind_check;
alter table public.audit_log add constraint audit_log_target_kind_check
  check (target_kind in ('listing', 'user', 'order', 'dispute', 'report', 'review', 'notification', 'category'));

commit;
