truncate table queue_entries;
update queue_stats set total = 0 where id = 1;
