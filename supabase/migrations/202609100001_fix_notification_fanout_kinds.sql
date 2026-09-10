-- Repair the Phase 5 notification fan-out so it stops aborting the user
-- actions it hangs off.
--
-- 202608200002_extend_notification_fanout.sql wrote notification rows with
-- `kind = 'social'` and `target_kind in ('user', 'listing', 'report',
-- 'dispute', 'broadcast')`. None of those values pass the check
-- constraints declared on `public.notifications` in
-- 202607150007_phase_3_social.sql:
--
--   kind        in (chat, offer, follow, price_drop, like, sold, order, system)
--   target_kind in (chat, product, seller, order, none)
--
-- The fan-out runs in an AFTER INSERT trigger, so the failing check
-- aborted the whole statement: liking a listing returned
-- `23514 new row for relation "notifications" violates check constraint
-- "notifications_kind_check"` and no like row was ever written. Following a
-- user, filing a report, opening a dispute and publishing an admin
-- broadcast failed the same way.
--
-- This migration:
--
--   1. maps every fan-out onto kinds and target kinds the client already
--      understands (`NOTIFICATION_KIND_TO_VIEW` / `TARGET_KIND_TO_VIEW` in
--      src/services/backend/mappers-social.ts) instead of widening the
--      constraints with values the UI cannot render;
--   2. re-points the like fan-out at `public.user_listing_likes` (the real
--      table; the old file named a `user_likes` table) and the follow
--      fan-out at `followee_id` (`following_id` and `follower_handle` are
--      not columns of `public.user_follows`), and reads the dispute's
--      seller from `orders` (`disputes` has no `seller_id`);
--   3. replaces the blanket `notifications_target_unique` constraint with a
--      partial index scoped to the idempotent fan-outs. As written, the
--      blanket constraint made the *second* chat message in a thread and
--      the *second* status change on an order fail with a duplicate key;
--   4. makes fan-out best-effort. A notification bug must never again roll
--      back the user action that triggered it; failures are logged as
--      warnings in the Postgres log instead.

begin;

-- ---------- notification uniqueness ----------

alter table public.notifications
  drop constraint if exists notifications_target_unique;

-- Only the fan-outs that must not fire twice for the same source row
-- (broadcasts, reports) write `target_kind = 'none'` with a non-null
-- `target_id`, so uniqueness is scoped to exactly those rows. Chat
-- threads, orders and listings legitimately produce many notifications
-- for the same target.
do $$
begin
  create unique index if not exists notifications_source_unique_idx
    on public.notifications (recipient_id, target_id)
    where target_kind = 'none' and target_id is not null;
exception when unique_violation then
  raise warning
    'notifications_source_unique_idx not created: duplicate (recipient_id, target_id) rows exist for target_kind = none';
end
$$;

-- ---------- helpers ----------

create or replace function public.admin_user_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where is_admin = true and is_suspended = false;
$$;

grant execute on function public.admin_user_ids() to authenticated;

-- ---------- follow fan-out ----------

create or replace function public.fanout_user_follow() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_handle text;
begin
  select coalesce(nullif(p.handle, ''), nullif(p.full_name_en, ''))
    into v_handle
    from public.profiles p
   where p.id = new.follower_id;

  insert into public.notifications (
    recipient_id, kind, title_en, title_ar, body_en, body_ar,
    target_kind, target_id
  ) values (
    new.followee_id,
    'follow',
    'You have a new follower',
    'لديك متابع جديد',
    format('%s started following you.', coalesce(v_handle, 'A DANEG user')),
    format('بدأ %s بمتابعتك.', coalesce(v_handle, 'مستخدم في دانق')),
    'seller', new.follower_id
  );
  return new;
exception when others then
  raise warning 'fanout_user_follow failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists user_follow_fanout on public.user_follows;
create trigger user_follow_fanout
  after insert on public.user_follows
  for each row execute function public.fanout_user_follow();

-- ---------- listing like fan-out ----------

create or replace function public.fanout_listing_like() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid;
  v_title_en text;
  v_title_ar text;
begin
  select l.seller_id, l.title_en, l.title_ar
    into v_seller, v_title_en, v_title_ar
    from public.listings l
   where l.id = new.listing_id;

  if v_seller is null or v_seller = new.user_id then
    return new;
  end if;

  -- Likes are a toggle: un-liking and re-liking must not spam the seller
  -- with one notification per tap.
  if exists (
    select 1 from public.notifications n
     where n.recipient_id = v_seller
       and n.kind = 'like'
       and n.target_id = new.listing_id
       and n.created_at > timezone('utc', now()) - interval '24 hours'
  ) then
    return new;
  end if;

  insert into public.notifications (
    recipient_id, kind, title_en, title_ar, body_en, body_ar,
    target_kind, target_id
  ) values (
    v_seller,
    'like',
    'Someone liked your listing',
    'شخص أعجب بإعلانك',
    format('Your listing "%s" got a new like.', coalesce(v_title_en, 'Untitled')),
    format('إعلانك "%s" حصل على إعجاب جديد.', coalesce(v_title_ar, 'بدون عنوان')),
    'product', new.listing_id
  );
  return new;
exception when others then
  raise warning 'fanout_listing_like failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists listing_like_fanout on public.user_listing_likes;
create trigger listing_like_fanout
  after insert on public.user_listing_likes
  for each row execute function public.fanout_listing_like();

-- 202608200002 attached this trigger to a `user_likes` table that no
-- migration in this repository creates. Drop the stale copy wherever such
-- a table was hand-created.
do $$
begin
  if to_regclass('public.user_likes') is not null then
    execute 'drop trigger if exists listing_like_fanout on public.user_likes';
  end if;
end
$$;

-- ---------- report fan-out ----------

create or replace function public.fanout_report_open() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
begin
  if new.status <> 'open' then
    return new;
  end if;
  for v_admin_id in select public.admin_user_ids()
  loop
    insert into public.notifications (
      recipient_id, kind, title_en, title_ar, body_en, body_ar,
      target_kind, target_id
    ) values (
      v_admin_id,
      'system',
      'New report filed',
      'إبلاغ جديد',
      format('Case %s opened: %s on %s %s',
        new.case_number, new.reason, new.target, new.target_id),
      format('تم فتح الحالة %s: %s على %s %s',
        new.case_number, new.reason, new.target, new.target_id),
      'none', new.id
    )
    on conflict do nothing;
  end loop;
  return new;
exception when others then
  raise warning 'fanout_report_open failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists report_open_fanout on public.reports;
create trigger report_open_fanout
  after insert on public.reports
  for each row execute function public.fanout_report_open();

-- ---------- dispute fan-out ----------

create or replace function public.fanout_dispute_open() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid;
  v_buyer uuid;
begin
  select o.seller_id, o.buyer_id into v_seller, v_buyer
    from public.orders o
   where o.id = new.order_id;
  v_buyer := coalesce(new.buyer_id, v_buyer);

  if v_seller is not null then
    insert into public.notifications (
      recipient_id, kind, title_en, title_ar, body_en, body_ar,
      target_kind, target_id
    ) values (
      v_seller,
      'order',
      'A buyer opened a dispute',
      'مشترٍ فتح نزاعاً',
      coalesce(nullif(new.body, ''), 'Please review and respond promptly.'),
      coalesce(nullif(new.body, ''), 'يرجى المراجعة والرد في أقرب وقت.'),
      'order', new.order_id
    );
  end if;

  if v_buyer is not null then
    insert into public.notifications (
      recipient_id, kind, title_en, title_ar, body_en, body_ar,
      target_kind, target_id
    ) values (
      v_buyer,
      'order',
      'Dispute submitted',
      'تم تقديم النزاع',
      'Your dispute was submitted. The seller has been notified and our team is reviewing it.',
      'تم تقديم نزاعك. تم إبلاغ البائع وفريقنا يراجع الحالة.',
      'order', new.order_id
    );
  end if;
  return new;
exception when others then
  raise warning 'fanout_dispute_open failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists dispute_open_fanout on public.disputes;
create trigger dispute_open_fanout
  after insert on public.disputes
  for each row execute function public.fanout_dispute_open();

-- ---------- broadcast fan-out ----------

-- `broadcast_notifications.kind` is already constrained to
-- ('system', 'order', 'price_drop'), all of which are valid notification
-- kinds; only the target kind needed fixing. `target_id` keeps pointing at
-- the broadcast row so `notifications_source_unique_idx` makes a re-run
-- idempotent.
create or replace function public.fanout_broadcast_notification() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if new.expires_at is not null and new.expires_at < timezone('utc', now()) then
    return new;
  end if;
  for v_user_id in
    select id from public.profiles
    where is_suspended = false
  loop
    insert into public.notifications (
      recipient_id, kind, title_en, title_ar, body_en, body_ar,
      target_kind, target_id
    ) values (
      v_user_id,
      new.kind,
      new.title_en,
      new.title_ar,
      new.body_en,
      new.body_ar,
      'none', new.id
    )
    on conflict do nothing;
  end loop;
  return new;
exception when others then
  raise warning 'fanout_broadcast_notification failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists broadcast_notification_fanout on public.broadcast_notifications;
create trigger broadcast_notification_fanout
  after insert on public.broadcast_notifications
  for each row execute function public.fanout_broadcast_notification();

commit;
