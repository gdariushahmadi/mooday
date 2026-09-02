-- Phase 5 patch: server-side unread count for chat threads.
--
-- Audit finding 3.2.2: client computed unread from localStorage, which is
-- inaccurate in multi-device scenarios. This migration adds a
-- `unread_count` column to `chat_threads` plus a trigger that increments
-- the count for the recipient whenever a new chat message arrives.
-- The mark-as-read operation is a simple UPDATE that the client (or a
-- service role helper) can call when the inbox is opened.
--
-- The trigger is `security definer` so the increment runs even when the
-- caller only has RLS-scoped access to their own thread row.

begin;

-- ---------- schema ----------

alter table public.chat_threads
  add column if not exists buyer_unread_count integer not null default 0
    check (buyer_unread_count >= 0),
  add column if not exists seller_unread_count integer not null default 0
    check (seller_unread_count >= 0);

-- ---------- unread increment on new message ----------

create or replace function public.fanout_chat_unread() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_seller uuid;
begin
  select buyer_id, seller_id into v_buyer, v_seller
    from public.chat_threads
   where id = new.thread_id;
  if v_buyer is null then
    return new;
  end if;

  -- The sender's counter never increments. The recipient's counter
  -- increments for every new text/offer/system message; image messages
  -- also count so the inbox badge reflects unread attachments.
  if new.sender_id = v_buyer then
    update public.chat_threads
       set seller_unread_count = seller_unread_count + 1,
           updated_at = timezone('utc', now())
     where id = new.thread_id;
  elsif new.sender_id = v_seller then
    update public.chat_threads
       set buyer_unread_count = buyer_unread_count + 1,
           updated_at = timezone('utc', now())
     where id = new.thread_id;
  end if;
  return new;
end;
$$;

drop trigger if exists chat_message_unread_increment on public.chat_messages;
create trigger chat_message_unread_increment
  after insert on public.chat_messages
  for each row execute function public.fanout_chat_unread();

-- ---------- mark-as-read helper ----------

-- A user marks a thread as read by resetting their own counter. We keep
-- this server-side so RLS guarantees the caller can only touch their
-- own counter (the WHERE clause enforces that).
create or replace function public.chat_mark_thread_read(p_thread_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_buyer uuid;
  v_seller uuid;
begin
  if v_uid is null then
    return;
  end if;
  select buyer_id, seller_id into v_buyer, v_seller
    from public.chat_threads
   where id = p_thread_id;
  if v_buyer is null then
    return;
  end if;
  if v_uid = v_buyer then
    update public.chat_threads
       set buyer_unread_count = 0
     where id = p_thread_id and buyer_id = v_uid;
  elsif v_uid = v_seller then
    update public.chat_threads
       set seller_unread_count = 0
     where id = p_thread_id and seller_id = v_uid;
  end if;
end;
$$;

grant execute on function public.chat_mark_thread_read(uuid) to authenticated;

-- ---------- grants ----------

-- The new columns follow the existing select/update policy on
-- chat_threads, so no policy changes are required; we only need to
-- grant the column-privileges implicitly via the existing grant.
grant select, update on table public.chat_threads to authenticated;

commit;
