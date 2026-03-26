-- Add role invite tokens to each workspace's bot
ALTER TABLE telegram_bots
  ADD COLUMN IF NOT EXISTS manager_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  ADD COLUMN IF NOT EXISTS staff_token    TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

-- Track which staff have connected and what role they have
CREATE TABLE IF NOT EXISTS telegram_connections (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    BIGINT NOT NULL,
  user_id    UUID   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT   NOT NULL DEFAULT 'staff' CHECK (role IN ('manager', 'staff')),
  first_name TEXT,
  username   TEXT,
  linked_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

ALTER TABLE telegram_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their telegram connections"
  ON telegram_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Activity log for every Telegram workflow run
CREATE TABLE IF NOT EXISTS telegram_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id       BIGINT NOT NULL,
  workflow_key  TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  triggered_by  TEXT,
  role          TEXT NOT NULL DEFAULT 'staff',
  status        TEXT NOT NULL CHECK (status IN ('success', 'error')),
  result        TEXT,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE telegram_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own telegram runs"
  ON telegram_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role insert telegram runs"
  ON telegram_runs FOR INSERT
  WITH CHECK (true);

CREATE INDEX telegram_runs_user_id_idx  ON telegram_runs (user_id);
CREATE INDEX telegram_runs_created_at_idx ON telegram_runs (created_at DESC);
