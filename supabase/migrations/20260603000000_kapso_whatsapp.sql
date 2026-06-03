-- Kapso WhatsApp integration
-- Lets each workspace connect a WhatsApp number and route messages into the
-- existing bot_entries sales log.

CREATE TABLE IF NOT EXISTS kapso_connections (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kapso_customer_id     TEXT,
  external_customer_id  TEXT,
  setup_link_url        TEXT,
  setup_link_expires_at TIMESTAMPTZ,
  phone_number_id       TEXT,
  phone_number          TEXT,
  display_name          TEXT,
  status                TEXT NOT NULL DEFAULT 'setup_pending',
  webhook_secret_set    BOOLEAN NOT NULL DEFAULT FALSE,
  last_webhook_at       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS kapso_connections_user_id_idx
  ON kapso_connections(user_id);

CREATE INDEX IF NOT EXISTS kapso_connections_phone_number_id_idx
  ON kapso_connections(phone_number_id)
  WHERE phone_number_id IS NOT NULL;

ALTER TABLE kapso_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own Kapso connection" ON kapso_connections;
CREATE POLICY "Users manage own Kapso connection"
  ON kapso_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS kapso_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id    UUID REFERENCES kapso_connections(id) ON DELETE SET NULL,
  kapso_message_id TEXT,
  phone_number_id  TEXT,
  direction        TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number      TEXT,
  to_number        TEXT,
  contact_name     TEXT,
  message_type     TEXT,
  content          TEXT,
  raw_payload      JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kapso_messages_user_id_created_at_idx
  ON kapso_messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS kapso_messages_kapso_message_id_idx
  ON kapso_messages(kapso_message_id)
  WHERE kapso_message_id IS NOT NULL;

ALTER TABLE kapso_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own Kapso messages" ON kapso_messages;
CREATE POLICY "Users view own Kapso messages"
  ON kapso_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS kapso_webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  event           TEXT,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE kapso_webhook_events ENABLE ROW LEVEL SECURITY;
-- No user policies: service role only.

ALTER TABLE bot_entries
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'telegram';

UPDATE bot_entries
SET channel = CASE
  WHEN source LIKE 'whatsapp%' THEN 'whatsapp'
  WHEN source LIKE 'web%' THEN 'web'
  ELSE 'telegram'
END
WHERE channel IS NULL;
