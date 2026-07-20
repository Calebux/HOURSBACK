-- Direct Meta WhatsApp Cloud API support + webhook event inbox.

-- 1. Allow 'meta' as a first-class WhatsApp provider on connections.
ALTER TABLE kapso_connections
  DROP CONSTRAINT IF EXISTS kapso_connections_whatsapp_provider_check;
ALTER TABLE kapso_connections
  ADD CONSTRAINT kapso_connections_whatsapp_provider_check
    CHECK (whatsapp_provider IN ('kapso', 'waba_gateway', 'zernio', 'meta'));

-- 2. Extend the dedupe table into a webhook inbox: every provider adapter
--    records the raw event before fast-acking, then background processing
--    marks it processed/failed. Failed rows are queryable for replay.
ALTER TABLE kapso_webhook_events
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'processed',
  ADD COLUMN IF NOT EXISTS error TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- New rows are inserted with status 'received'; pre-existing rows default to
-- 'processed' (they were handled synchronously before this migration).

CREATE INDEX IF NOT EXISTS kapso_webhook_events_unfinished_idx
  ON kapso_webhook_events (status, processed_at DESC)
  WHERE status <> 'processed';
