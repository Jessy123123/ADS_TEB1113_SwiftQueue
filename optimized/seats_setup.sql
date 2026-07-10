-- Run this once in Supabase Dashboard -> SQL Editor
-- Sets up the cinema-style seat grid: 4 sections x 5 rows x 10 seats = 200 seats.
-- Booking is race-safe: an update only succeeds if the seat is still
-- 'available' at the moment it runs, so two people can never book the
-- same seat even if they click at the same instant.

drop table if exists seats cascade;

create table seats (
  id bigint generated always as identity primary key,
  section text not null,
  seat_row text not null,
  seat_number int not null,
  price numeric not null,
  status text not null default 'available' check (status in ('available', 'booked')),
  unique (section, seat_row, seat_number)
);

alter table seats enable row level security;

-- anyone can see every seat's status and price (needed client-side to
-- build the linear-scan array and the BST for the search demo)
create policy "anyone can view seats"
  on seats for select
  to anon
  using (true);

-- anyone can book a seat, but ONLY if it is still available right now,
-- and the only allowed resulting state is 'booked'
create policy "anyone can book an available seat"
  on seats for update
  to anon
  using (status = 'available')
  with check (status = 'booked');

-- column-level lock: even if someone crafts a request to change price/section,
-- the anon role is only granted permission to touch the status column
revoke update on seats from anon;
grant update (status) on seats to anon;

-- enable realtime so every device sees seats go gray the instant they're booked
alter publication supabase_realtime add table seats;

-- seed data: 4 sections x 5 rows (A-E) x 10 seats = 200 seats
do $$
declare
  sec record;
  r text;
  n int;
begin
  for sec in select * from (values
    ('VIP', 450),
    ('A', 250),
    ('B', 150),
    ('C', 85)
  ) as t(section, price)
  loop
    foreach r in array array['A', 'B', 'C', 'D', 'E'] loop
      for n in 1..10 loop
        insert into seats (section, seat_row, seat_number, price)
        values (sec.section, r, n, sec.price);
      end loop;
    end loop;
  end loop;
end $$;
