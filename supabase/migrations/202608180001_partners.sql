-- Phase 5 (Monetization): partner registry for outbound affiliate links.
begin;
create table public.partners (
  code text primary key,
  name text not null,
  logo_url text,
  base_url_template text,
  is_active boolean not null default true,
  display_order smallint not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create index partners_active_order_idx on public.partners(is_active, display_order, code);
alter table public.partners enable row level security;
grant select on table public.partners to anon, authenticated;
revoke insert, update, delete on table public.partners from anon, authenticated;
create policy "partners_select_all" on public.partners for select to anon, authenticated using (true);
create policy "partners_insert_admin" on public.partners for insert to authenticated with check ((select is_admin from public.profiles p where p.id = auth.uid()));
create policy "partners_update_admin" on public.partners for update to authenticated using ((select is_admin from public.profiles p where p.id = auth.uid())) with check ((select is_admin from public.profiles p where p.id = auth.uid()));
create policy "partners_delete_admin" on public.partners for delete to authenticated using ((select is_admin from public.profiles p where p.id = auth.uid()));
commit;
grant insert, update, delete on table public.partners to authenticated;
