CREATE UNIQUE INDEX uk_time_entry_open_per_user
    ON time_entry (user_id)
    WHERE ended_at IS NULL;
