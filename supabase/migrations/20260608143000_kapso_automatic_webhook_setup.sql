-- Track automatic Kapso webhook registration for connected WhatsApp numbers.

ALTER TABLE kapso_connections
  ADD COLUMN IF NOT EXISTS setup_link_id TEXT,
  ADD COLUMN IF NOT EXISTS kapso_webhook_id TEXT,
  ADD COLUMN IF NOT EXISTS kapso_webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS kapso_webhook_registered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS kapso_webhook_error TEXT;

CREATE INDEX IF NOT EXISTS kapso_connections_kapso_webhook_id_idx
  ON kapso_connections(kapso_webhook_id)
  WHERE kapso_webhook_id IS NOT NULL;
