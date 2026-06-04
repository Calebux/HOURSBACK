-- Customer-facing WhatsApp configuration.

ALTER TABLE kapso_connections
  ADD COLUMN IF NOT EXISTS customer_menu TEXT,
  ADD COLUMN IF NOT EXISTS payment_instructions TEXT;
