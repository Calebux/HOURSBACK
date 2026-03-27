-- Data Sources registry: staff and workspace Google Sheet / doc links
-- Used by the Telegram bot to auto-fetch data instead of asking questions

CREATE TABLE IF NOT EXISTS data_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope           TEXT NOT NULL DEFAULT 'workspace' CHECK (scope IN ('workspace', 'staff')),
  staff_chat_id   BIGINT,         -- null for workspace scope
  staff_name      TEXT,           -- display name when scope = 'staff'
  label           TEXT NOT NULL,  -- e.g. "Daily Cash Log"
  url             TEXT NOT NULL,
  workflow_slot   TEXT NOT NULL,  -- e.g. 'reconcile:data', 'audit:system_records'
  verified        BOOLEAN DEFAULT false,
  verified_at     TIMESTAMPTZ,
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE data_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own data sources"
  ON data_sources FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX data_sources_user_id_idx     ON data_sources (user_id);
CREATE INDEX data_sources_workflow_slot_idx ON data_sources (user_id, workflow_slot);
