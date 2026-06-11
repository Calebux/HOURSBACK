-- Add per-connection provider tracking so Kapso and Zernio users can coexist.
-- Existing rows default to 'kapso' — no data migration needed.

ALTER TABLE kapso_connections
  ADD COLUMN IF NOT EXISTS whatsapp_provider TEXT NOT NULL DEFAULT 'kapso'
    CHECK (whatsapp_provider IN ('kapso', 'waba_gateway', 'zernio'));

-- Backfill waba_gateway rows based on their stored webhook URL
UPDATE kapso_connections
  SET whatsapp_provider = 'waba_gateway'
  WHERE kapso_webhook_url ILIKE '%waba-gateway-webhook%';

CREATE INDEX IF NOT EXISTS kapso_connections_provider_idx
  ON kapso_connections (whatsapp_provider)
  WHERE whatsapp_provider != 'kapso';
