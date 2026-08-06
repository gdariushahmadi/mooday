-- Phase 4, slice M4: notification fan-out.
--
-- The Phase 1 mock seeded the activity feed client-side. Real flows need
-- server-driven notifications so a buyer sees "seller shipped" without
-- the app being open. This migration adds AFTER INSERT/UPDATE triggers
-- that write into the `notifications` table whenever:
--
--   - a chat message is sent (the OTHER party gets notified)
--   - an offer message is sent (the seller gets notified)
--   - an order changes status (the OTHER party gets notified)
--   - a seller review is written (the seller gets notified)
--
-- The trigger functions are `security definer` so the `notifications`
-- insert is allowed regardless of the calling user's RLS context.

begin;

-- ---------- helpers ----------

-- Returns the recipient for a chat_message notification: the other
-- party in the thread.
create or replace function public.chat_recipient_for_message(
  p_thread_id uuid,
  p_sender_id uuid
) returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when buyer_id = p_sender_id then seller_id
    else buyer_id
  end
  from public.chat_threads
  where id = p_thread_id;
$$;

-- Returns the recipient for an order status-change notification: the
-- other side of the order.
create or replace function public.order_recipient_for_status(
  p_order_id uuid,
  p_caller uuid
) returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when buyer_id = p_caller then seller_id
    else buyer_id
  end
  from public.orders
  where id = p_order_id;
$$;

grant execute on function public.chat_recipient_for_message(uuid, uuid) to authenticated;
grant execute on function public.order_recipient_for_status(uuid, uuid) to authenticated;

-- ---------- chat text + offer fan-out ----------

create or replace function public.fanout_chat_message() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_thread record;
begin
  select * into v_thread from public.chat_threads where id = new.thread_id;
  if v_thread.id is null then
    return new;
  end if;
  v_recipient := case
    when v_thread.buyer_id = new.sender_id then v_thread.seller_id
    when v_thread.seller_id = new.sender_id then v_thread.buyer_id
    else null
  end;
  if v_recipient is null or v_recipient = new.sender_id then
    return new;
  end if;

  if new.type = 'offer' then
    insert into public.notifications (
      recipient_id, kind, title_en, title_ar, body_en, body_ar,
      target_kind, target_id
    ) values (
      v_recipient,
      'offer',
      'New offer received',
      'عرض جديد',
      format('Buyer offered AED %s on %s',
        round(new.offer_minor / 100.0)::text,
        v_thread.listing_title_en),
      format('عرض المشتري %s درهم على %s',
        round(new.offer_minor / 100.0)::text,
        v_thread.listing_title_ar),
      'chat', v_thread.id
    );
  else
    insert into public.notifications (
      recipient_id, kind, title_en, title_ar, body_en, body_ar,
      target_kind, target_id
    ) values (
      v_recipient,
      'chat',
      'New message',
      'رسالة جديدة',
      coalesce(new.body, ''),
      coalesce(new.body, ''),
      'chat', v_thread.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists chat_message_fanout on public.chat_messages;
create trigger chat_message_fanout
  after insert on public.chat_messages
  for each row execute function public.fanout_chat_message();

-- ---------- order status fan-out ----------

create or replace function public.fanout_order_status() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient uuid;
  v_status_label_en text;
  v_status_label_ar text;
begin
  if (tg_op = 'INSERT') then
    -- A new paid order notifies the seller.
    v_recipient := new.seller_id;
    v_status_label_en := 'New order placed';
    v_status_label_ar := 'طلب جديد';
  elsif (new.status is distinct from old.status) then
    -- Status transition: notify the other side.
    v_recipient := case
      when new.buyer_id = auth.uid() then new.seller_id
      else new.buyer_id
    end;
    v_status_label_en := case new.status
      when 'shipped' then 'Your order has shipped'
      when 'delivered' then 'Your order was delivered'
      when 'returned' then 'A return was requested'
      when 'cancelled' then 'An order was cancelled'
      else 'Order updated'
    end;
    v_status_label_ar := case new.status
      when 'shipped' then 'تم شحن طلبك'
      when 'delivered' then 'تم تسليم طلبك'
      when 'returned' then 'تم طلب إرجاع'
      when 'cancelled' then 'تم إلغاء طلب'
      else 'تحديث الطلب'
    end;
  else
    return new;
  end if;

  insert into public.notifications (
    recipient_id, kind, title_en, title_ar, body_en, body_ar,
    target_kind, target_id
  ) values (
    v_recipient,
    'order',
    v_status_label_en,
    v_status_label_ar,
    coalesce(new.courier_tracking, '—'),
    coalesce(new.courier_tracking, '—'),
    'order', new.id
  );
  return new;
end;
$$;

drop trigger if exists order_status_fanout on public.orders;
create trigger order_status_fanout
  after insert or update on public.orders
  for each row execute function public.fanout_order_status();

-- ---------- seller review fan-out ----------

create or replace function public.fanout_seller_review() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (
    recipient_id, kind, title_en, title_ar, body_en, body_ar,
    target_kind, target_id
  ) values (
    new.seller_id,
    'system',
    format('New %s-star review', new.rating),
    format('تقييم جديد %s نجوم', new.rating),
    coalesce(new.body_en, ''),
    coalesce(new.body_ar, ''),
    'seller', new.seller_id
  );
  return new;
end;
$$;

drop trigger if exists seller_review_fanout on public.seller_reviews;
create trigger seller_review_fanout
  after insert on public.seller_reviews
  for each row execute function public.fanout_seller_review();

commit;
