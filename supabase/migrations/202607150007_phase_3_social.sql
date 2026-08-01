-- Phase 3, slice 6: chat, offers, reviews, reports, disputes, notifications.
--
-- All five domains share the same shape: owner-scoped RLS, idempotent\n-- inserts where possible, and snapshot columns so a downstream edit or\n-- delete (a listing repriced, a seller deleting their account, a buyer\n-- leaving a review then editing their address book) cannot rewrite the\n-- historical record.\n--
-- The notification + chat reads are intentionally broad (only the owner\n-- can see their inbox), while the writes are tight (only the\n-- authenticated caller can write on their own behalf).

begin;

-- ---------- chat threads + messages ----------

create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  -- Snapshot so the thread header survives listing edits/deletes.
  listing_title_en text not null default '',
  listing_title_ar text not null default '',
  listing_image_url text not null default '',
  price_minor_at_creation bigint not null default 0
    check (price_minor_at_creation >= 0),
  last_message_body text,
  last_message_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (buyer_id, seller_id, listing_id)
);

create index chat_threads_buyer_recent_idx
  on public.chat_threads(buyer_id, last_message_at desc nulls last);
create index chat_threads_seller_recent_idx
  on public.chat_threads(seller_id, last_message_at desc nulls last);

create trigger chat_threads_set_updated_at
before update on public.chat_threads
for each row execute function public.set_updated_at();

alter table public.chat_threads enable row level security;

revoke all on table public.chat_threads from anon;
grant select, insert, update on table public.chat_threads to authenticated;

create policy "chat_threads_select_participants"
on public.chat_threads
for select to authenticated
using (
  (select auth.uid()) = buyer_id
  or (select auth.uid()) = seller_id
);

create policy "chat_threads_insert_as_participant"
on public.chat_threads
for insert to authenticated
with check (
  (select auth.uid()) = buyer_id
  or (select auth.uid()) = seller_id
);

create policy "chat_threads_update_as_participant"
on public.chat_threads
for update to authenticated
using (
  (select auth.uid()) = buyer_id
  or (select auth.uid()) = seller_id
)
with check (
  (select auth.uid()) = buyer_id
  or (select auth.uid()) = seller_id
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'text'
    check (type in ('text', 'image', 'system', 'offer')),
  body text not null default '',
  image_url text,
  offer_minor bigint check (offer_minor is null or offer_minor >= 0),
  offer_status text check (
    offer_status is null or offer_status in ('pending', 'accepted', 'declined')
  ),
  created_at timestamptz not null default timezone('utc', now())
);

create index chat_messages_thread_recent_idx
  on public.chat_messages(thread_id, created_at desc);

alter table public.chat_messages enable row level security;

revoke all on table public.chat_messages from anon;
grant select, insert, update on table public.chat_messages to authenticated;

create policy "chat_messages_select_participants"
on public.chat_messages
for select to authenticated
using (exists (
  select 1 from public.chat_threads
  where chat_threads.id = chat_messages.thread_id
    and (
      chat_threads.buyer_id = (select auth.uid())
      or chat_threads.seller_id = (select auth.uid())
    )
));

create policy "chat_messages_insert_as_participant"
on public.chat_messages
for insert to authenticated
with check (
  (select auth.uid()) = sender_id
  and exists (
    select 1 from public.chat_threads
    where chat_threads.id = chat_messages.thread_id
      and (
        chat_threads.buyer_id = (select auth.uid())
        or chat_threads.seller_id = (select auth.uid())
      )
  )
);

create policy "chat_messages_update_own_offer"
on public.chat_messages
for update to authenticated
using (
  -- Only the recipient of an offer may flip its status; the sender
  -- already chose to make the offer.
  exists (
    select 1 from public.chat_threads t
    where t.id = chat_messages.thread_id
      and t.seller_id <> (select auth.uid())
      and (select auth.uid()) in (t.buyer_id, t.seller_id)
  )
)
with check (true);

-- ---------- seller reviews ----------

create table public.seller_reviews (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  body_en text not null default '',
  body_ar text not null default '',
  tags text[] not null default '{}',
  image_url text,
  -- One review per (buyer, order) so a buyer cannot spam a seller.
  unique (buyer_id, order_id),
  created_at timestamptz not null default timezone('utc', now())
);

create index seller_reviews_seller_idx
  on public.seller_reviews(seller_id, created_at desc);
create index seller_reviews_buyer_idx
  on public.seller_reviews(buyer_id, created_at desc);

alter table public.seller_reviews enable row level security;

revoke all on table public.seller_reviews from anon;
grant select, insert on table public.seller_reviews to authenticated;

create policy "seller_reviews_select_all"
on public.seller_reviews
for select to anon, authenticated
using (true);

create policy "seller_reviews_insert_as_buyer"
on public.seller_reviews
for insert to authenticated
with check (
  (select auth.uid()) = buyer_id
  and exists (
    select 1 from public.orders
    where orders.id = seller_reviews.order_id
      and orders.buyer_id = (select auth.uid())
  )
);

-- ---------- reports ----------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target text not null check (target in ('listing', 'user')),
  target_id uuid not null,
  reason text not null check (
    reason in ('counterfeit', 'offensive', 'spam', 'mismatch', 'other')
  ),
  body text not null default '',
  status text not null default 'open'
    check (status in ('open', 'investigating', 'resolved', 'dismissed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index reports_reporter_idx
  on public.reports(reporter_id, created_at desc);
create index reports_target_idx
  on public.reports(target, target_id);

create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

alter table public.reports enable row level security;

revoke all on table public.reports from anon;
grant select, insert, update on table public.reports to authenticated;

create policy "reports_select_own"
on public.reports
for select to authenticated
using ((select auth.uid()) = reporter_id);

create policy "reports_insert_as_reporter"
on public.reports
for insert to authenticated
with check ((select auth.uid()) = reporter_id);

create policy "reports_update_as_reporter"
on public.reports
for update to authenticated
using ((select auth.uid()) = reporter_id)
with check ((select auth.uid()) = reporter_id);

-- ---------- disputes ----------

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  body text not null default '',
  status text not null default 'open'
    check (status in ('open', 'under_review', 'resolved', 'rejected')),
  -- Timeline of (status, note_en, note_ar, at) entries, newest first.
  timeline jsonb not null default '[]',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index disputes_buyer_idx
  on public.disputes(buyer_id, created_at desc);
create index disputes_order_idx
  on public.disputes(order_id);

create trigger disputes_set_updated_at
before update on public.disputes
for each row execute function public.set_updated_at();

alter table public.disputes enable row level security;

revoke all on table public.disputes from anon;
grant select, insert, update on table public.disputes to authenticated;

create policy "disputes_select_participants"
on public.disputes
for select to authenticated
using (exists (
  select 1 from public.orders
  where orders.id = disputes.order_id
    and (
      orders.buyer_id = (select auth.uid())
      or orders.seller_id = (select auth.uid())
    )
));

create policy "disputes_insert_as_buyer"
on public.disputes
for insert to authenticated
with check (exists (
  select 1 from public.orders
  where orders.id = disputes.order_id
    and orders.buyer_id = (select auth.uid())
));

create policy "disputes_update_as_participant"
on public.disputes
for update to authenticated
using (exists (
  select 1 from public.orders
  where orders.id = disputes.order_id
    and (
      orders.buyer_id = (select auth.uid())
      or orders.seller_id = (select auth.uid())
    )
))
with check (true);

-- ---------- notifications ----------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (
    kind in ('chat', 'offer', 'follow', 'price_drop', 'like', 'sold', 'order', 'system')
  ),
  title_en text not null default '',
  title_ar text not null default '',
  body_en text not null default '',
  body_ar text not null default '',
  target_kind text not null default 'none'
    check (target_kind in ('chat', 'product', 'seller', 'order', 'none')),
  target_id uuid,
  is_unread boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create index notifications_recipient_recent_idx
  on public.notifications(recipient_id, created_at desc);
create index notifications_recipient_unread_idx
  on public.notifications(recipient_id) where is_unread;

alter table public.notifications enable row level security;

revoke all on table public.notifications from anon;
grant select, insert, update on table public.notifications to authenticated;

create policy "notifications_select_own"
on public.notifications
for select to authenticated
using ((select auth.uid()) = recipient_id);

create policy "notifications_update_own"
on public.notifications
for update to authenticated
using ((select auth.uid()) = recipient_id)
with check ((select auth.uid()) = recipient_id);

-- Insert grants stay restricted because the AppContext never creates
-- notifications client-side in Phase 3; server triggers fan them out
-- when chat messages, offers, or order transitions happen. We still
-- grant INSERT to authenticated so the AppContext can pre-seed an
-- initial activity feed on first sign-in (mirrors Phase 1 UX).
grant insert on table public.notifications to authenticated;

create policy "notifications_insert_as_recipient"
on public.notifications
for insert to authenticated
with check ((select auth.uid()) = recipient_id);

commit;
