-- Harden WhatsApp customer requests with structured settings, typed requests, and audit logs.

ALTER TABLE kapso_connections
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS operating_hours TEXT,
  ADD COLUMN IF NOT EXISTS fulfillment_rules TEXT,
  ADD COLUMN IF NOT EXISTS escalation_instructions TEXT;

ALTER TABLE kapso_orders
  ADD COLUMN IF NOT EXISTS request_type TEXT NOT NULL DEFAULT 'order'
    CHECK (request_type IN ('order', 'booking', 'service', 'repair', 'quote', 'other'));

ALTER TABLE kapso_orders
  DROP CONSTRAINT IF EXISTS kapso_orders_fulfillment_status_check;

ALTER TABLE kapso_orders
  ADD CONSTRAINT kapso_orders_fulfillment_status_check
  CHECK (fulfillment_status IN ('new', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'completed'));

CREATE INDEX IF NOT EXISTS kapso_orders_user_request_type_idx
  ON kapso_orders(user_id, request_type, created_at DESC);

CREATE TABLE IF NOT EXISTS kapso_order_audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id  UUID REFERENCES kapso_connections(id) ON DELETE SET NULL,
  order_id       UUID REFERENCES kapso_orders(id) ON DELETE CASCADE,
  actor_type     TEXT NOT NULL DEFAULT 'owner'
                 CHECK (actor_type IN ('owner', 'customer', 'system')),
  action         TEXT NOT NULL,
  details        JSONB NOT NULL DEFAULT '{}'::jsonb,
  message_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kapso_order_audit_logs_order_created_idx
  ON kapso_order_audit_logs(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS kapso_order_audit_logs_user_created_idx
  ON kapso_order_audit_logs(user_id, created_at DESC);

ALTER TABLE kapso_order_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own Kapso order audit logs" ON kapso_order_audit_logs;
CREATE POLICY "Users view own Kapso order audit logs"
  ON kapso_order_audit_logs FOR SELECT
  USING (auth.uid() = user_id);
