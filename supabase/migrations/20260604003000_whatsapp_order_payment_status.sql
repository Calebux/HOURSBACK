-- Track payment confirmation for customer WhatsApp orders.

ALTER TABLE kapso_orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid')),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS kapso_orders_payment_status_idx
  ON kapso_orders(user_id, payment_status, created_at DESC);
