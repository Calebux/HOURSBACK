-- Add shift schedule config to telegram_bots so each workspace can configure
-- when their shifts end, which triggers the handover watcher.

ALTER TABLE telegram_bots
  ADD COLUMN IF NOT EXISTS shift_end_time           TEXT     DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS shift_days               TEXT[]   DEFAULT ARRAY['mon','tue','wed','thu','fri','sat'],
  ADD COLUMN IF NOT EXISTS handover_watcher_enabled BOOLEAN  DEFAULT false;

-- Track whether a handover reminder was already sent today.
-- Prevents duplicate pings if the watcher runs multiple times in the same day.
CREATE TABLE IF NOT EXISTS handover_checks (
  id                UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID     NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date        DATE     NOT NULL DEFAULT CURRENT_DATE,
  reminded_chat_ids BIGINT[] DEFAULT ARRAY[]::BIGINT[],
  UNIQUE(user_id, check_date)
);

ALTER TABLE handover_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages handover checks"
  ON handover_checks FOR ALL
  USING (true);
