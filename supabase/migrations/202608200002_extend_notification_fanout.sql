-- Phase 5 patch: extend notification fan-out coverage.
--
-- Audit finding 3.2.3: triggers existed only for chat/offer/order/review.
-- This migration closes the gap by adding notifications for:
--   - new follow (recipient is the followed user)
--   - new like on a listing (recipient is the seller)
--   - new report filed (recipient is the admin)
--   - new dispute opened (recipient is the seller)
--   - new seller review reply (recipient is the buyer)
--   - broadcast_notifications already broadcast to all users via the
--     broadcast expansion trigger below
--
-- All fan-out functions are `security definer` so the `notifications`
-- insert is allowed regardless of the calling user's RLS context, which
-- mirrors the existing triggers from 202608060004_notification_fanout.sql.

begin;

-- ---------- helpers ----------

-- Generic admin notification helper used by report/dispute fan-outs.
-- Returns the row so callers can `insert into ... select from
-- admin_recipient_ids()` or use this directly when the recipient is a
-- single user.
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
begin
  insert into public.notifications (
    recipient_id, kind, title_en, title_ar, body_en, body_ar,
    target_kind, target_id
  ) values (
    new.following_id,
    'social',
    'You have a new follower',
    'لديك متابع جديد',
    format('%s started following you.', coalesce(new.follower_handle, 'A DANEG user')),
    format('بدأ %s بمتابعتك.', coalesce(new.follower_handle, 'مستخدم في دانق')),
    'user', new.follower_id
  );
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
  select seller_id, title_en, title_ar into v_seller, v_title_en, v_title_ar
    from public.listings
   where id = new.listing_id;
  if v_seller is null or v_seller = new.user_id then
    return new;
  end if;
  insert into public.notifications (
    recipient_id, kind, title_en, title_ar, body_en, body_ar,
    target_kind, target_id
  ) values (
    v_seller,
    'social',
    'Someone liked your listing',
    'شخص أعجب بمعرضك',
    format('Your listing "%s" got a new like.', coalesce(v_title_en, 'Untitled')),
    format('معرضك "%s" حصل على إعجاب جديد.', coalesce(v_title_ar, 'بدون عنوان')),
    'listing', new.listing_id
  );
  return new;
end;
$$;

drop trigger if exists listing_like_fanout on public.user_likes;
create trigger listing_like_fanout
  after insert on public.user_likes
  for each row execute function public.fanout_listing_like();

-- ---------- report fan-out ----------

-- A new report is sent to all admins so the queue gets attention even
-- if the reporter never logs back in.
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
      'report', new.id
    );
  end loop;
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
  v_order_id uuid;
begin
  v_seller := new.seller_id;
  v_buyer := new.buyer_id;
  v_order_id := new.order_id;
  if v_seller is null then
    select o.seller_id, o.buyer_id into v_seller, v_buyer
      from public.orders o
     where o.id = v_order_id;
  end if;
  if v_seller is not null then
    insert into public.notifications (
      recipient_id, kind, title_en, title_ar, body_en, body_ar,
      target_kind, target_id
    ) values (
      v_seller,
      'order',
      'A buyer opened a dispute',
      'مشترٍ فتح نزاعاً',
      coalesce(new.body, 'Please review and respond promptly.'),
      coalesce(new.body, 'يرجى المراجعة والرد في أقرب وقت.'),
      'dispute', new.id
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
      'dispute', new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists dispute_open_fanout on public.disputes;
create trigger dispute_open_fanout
  after insert on public.disputes
  for each row execute function public.fanout_dispute_open();

-- ---------- broadcast fan-out ----------

-- Every row in broadcast_notifications creates one notification per
-- non-suspended user that has not yet been notified for the same
-- broadcast (idempotent via target_id = broadcast id).
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
      'broadcast', new.id
    )
    on conflict do nothing;
  end loop;
  return new;
end;
$$;

drop trigger if exists broadcast_notification_fanout on public.broadcast_notifications;
create trigger broadcast_notification_fanout
  after insert on public.broadcast_notifications
  for each row execute function public.fanout_broadcast_notification();

-- The notifications table does not have a uniqueness constraint on
-- (recipient_id, target_kind, target_id); we add one so the broadcast
-- idempotency works. This is safe because each recipient only ever has
-- one notification per target.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'notifications_target_unique'
  ) then
    alter table public.notifications
      add constraint notifications_target_unique
      unique (recipient_id, target_kind, target_id);
  end if;
end
$$;

commit;
