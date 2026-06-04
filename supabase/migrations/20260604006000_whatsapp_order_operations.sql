-- Operational review, totals, fulfillment, and AI trace fields for WhatsApp orders.

ALTER TABLE kapso_orders
  ADD COLUMN IF NOT EXISTS delivery_fee_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS expected_total_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS owner_adjusted_total_amount NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS owner_notes TEXT,
  ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'new'
    CHECK (fulfillment_status IN ('new', 'preparing', 'out_for_delivery', 'delivered')),
  ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS kapso_ai_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id  UUID REFERENCES kapso_connections(id) ON DELETE SET NULL,
  order_id       UUID REFERENCES kapso_orders(id) ON DELETE SET NULL,
  from_number    TEXT,
  message_id     TEXT,
  message_text   TEXT,
  action         TEXT,
  reply          TEXT,
  raw_response   JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kapso_ai_logs_user_created_idx
  ON kapso_ai_logs(user_id, created_at DESC);

ALTER TABLE kapso_ai_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own Kapso AI logs" ON kapso_ai_logs;
CREATE POLICY "Users view own Kapso AI logs"
  ON kapso_ai_logs FOR SELECT
  USING (auth.uid() = user_id);
