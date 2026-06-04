-- Harden WhatsApp orders against receipt mismatch and media-storage failures.

ALTER TABLE kapso_connections
  ADD COLUMN IF NOT EXISTS business_timezone TEXT NOT NULL DEFAULT 'Africa/Lagos';

ALTER TABLE kapso_orders
  ADD COLUMN IF NOT EXISTS order_code TEXT,
  ADD COLUMN IF NOT EXISTS receipt_storage_status TEXT NOT NULL DEFAULT 'not_received',
  ADD COLUMN IF NOT EXISTS receipt_storage_error TEXT,
  ADD COLUMN IF NOT EXISTS receipt_storage_failed_at TIMESTAMPTZ;

ALTER TABLE kapso_orders
  DROP CONSTRAINT IF EXISTS kapso_orders_receipt_storage_status_check;

ALTER TABLE kapso_orders
  ADD CONSTRAINT kapso_orders_receipt_storage_status_check
  CHECK (receipt_storage_status IN ('not_received', 'saved', 'failed'));

UPDATE kapso_orders
SET order_code = UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 8))
WHERE order_code IS NULL;

UPDATE kapso_orders
SET receipt_storage_status = CASE
  WHEN receipt_storage_path IS NOT NULL THEN 'saved'
  WHEN receipt_received_at IS NOT NULL THEN 'failed'
  ELSE 'not_received'
END
WHERE receipt_storage_status = 'not_received';

CREATE UNIQUE INDEX IF NOT EXISTS kapso_orders_user_order_code_key
  ON kapso_orders(user_id, order_code)
  WHERE order_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS kapso_orders_receipt_review_idx
  ON kapso_orders(user_id, payment_status, receipt_storage_status, created_at DESC);
