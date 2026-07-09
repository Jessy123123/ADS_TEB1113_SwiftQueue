-- Run this once in Supabase Dashboard -> SQL Editor
-- Replaces the previous version: no anonymous role can ever read raw
-- names/session ids/timestamps, directly or via realtime. Only an
-- anonymized total count is broadcast, and each device can look up
-- ONLY its own position through a locked-down RPC.

-- if you already ran an earlier version of this script, clear it out first
drop table if exists queue_entries cascade;
drop table if exists queue_stats cascade;
drop function if exists get_queue_count();
drop function if exists get_my_position(text);

-- 1. Table that stores each person's queue entry (never readable by anon)
create table queue_entries (
  id bigint generated always as identity primary key,
  session_id text not null unique,
  name text not null,
  joined_at timestamptz not null default now()
);

alter table queue_entries enable row level security;

-- anyone can add themselves to the queue
create policy "anyone can join queue"
  on queue_entries for insert
  to anon
  with check (true);

-- no select/update/delete policies exist for anon, so the raw table
-- can never be read directly, and it is excluded from realtime broadcasts.

-- 2. Single-row stats table exposing only the aggregate count, no PII
create table queue_stats (
  id smallint primary key default 1,
  total int not null default 0,
  constraint single_row check (id = 1)
);
insert into queue_stats (id, total) values (1, 0);

alter table queue_stats enable row level security;

create policy "anyone can read stats"
  on queue_stats for select
  to anon
  using (true);

-- 3. Trigger: every insert into queue_entries bumps the public counter
create or replace function bump_queue_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update queue_stats set total = total + 1 where id = 1;
  return new;
end;
$$;

create trigger on_queue_entry_insert
  after insert on queue_entries
  for each row execute function bump_queue_total();

-- 4. RPC: lets a device look up ONLY its own ticket/position, never anyone else's row
create or replace function get_my_status(p_session_id text)
returns table(ticket bigint, queue_position bigint)
language sql
security definer
set search_path = public
as $$
  select id as ticket, rank as queue_position from (
    select id, session_id, row_number() over (order by id) as rank
    from queue_entries
  ) ranked
  where ranked.session_id = p_session_id;
$$;

grant execute on function get_my_status(text) to anon;

-- 5. Enable realtime only on the anonymized stats table (a single integer, no PII)
alter publication supabase_realtime add table queue_stats;
