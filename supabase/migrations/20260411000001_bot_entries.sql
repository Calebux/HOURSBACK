CREATE TABLE IF NOT EXISTS bot_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chat_id      BIGINT NOT NULL,
  triggered_by TEXT,
  role         TEXT,
  raw_text     TEXT NOT NULL,
  entry_type   TEXT DEFAULT 'sale',
  parsed_data  JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bot_entries_user_id_idx ON bot_entries(user_id);
CREATE INDEX IF NOT EXISTS bot_entries_created_at_idx ON bot_entries(created_at DESC);

ALTER TABLE bot_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own entries" ON bot_entries;
CREATE POLICY "Users can view own entries"
  ON bot_entries FOR SELECT USING (auth.uid() = user_id);
