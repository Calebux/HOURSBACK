CREATE TABLE IF NOT EXISTS business_pending_internal_senders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id     TEXT NOT NULL,
  normalized_id TEXT,
  contact_name  TEXT,
  last_message  TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'linked', 'ignored')),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, sender_id)
);

CREATE INDEX IF NOT EXISTS business_pending_internal_senders_user_status_idx
  ON business_pending_internal_senders(user_id, status, last_seen_at DESC);

ALTER TABLE business_pending_internal_senders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own pending internal senders" ON business_pending_internal_senders;
CREATE POLICY "Users manage own pending internal senders"
  ON business_pending_internal_senders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
