-- Separate customer receipt submission from owner payment verification.

ALTER TABLE kapso_orders
  DROP CONSTRAINT IF EXISTS kapso_orders_payment_status_check;

UPDATE kapso_orders
SET payment_status = 'receipt_sent'
WHERE payment_status = 'paid';

ALTER TABLE kapso_orders
  ADD CONSTRAINT kapso_orders_payment_status_check
  CHECK (payment_status IN ('unpaid', 'receipt_sent', 'verified'));

ALTER TABLE kapso_orders
  ADD COLUMN IF NOT EXISTS receipt_received_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_message_id TEXT,
  ADD COLUMN IF NOT EXISTS receipt_url TEXT,
  ADD COLUMN IF NOT EXISTS receipt_payload JSONB,
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ;
