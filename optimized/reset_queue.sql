-- RESTART IDENTITY resets the auto-incrementing ticket number back to 1;
-- a plain TRUNCATE clears the rows but leaves the counter wherever it was.
truncate table queue_entries restart identity;
update queue_stats set total = 0 where id = 1;
