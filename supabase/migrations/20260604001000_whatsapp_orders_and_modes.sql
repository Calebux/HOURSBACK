-- Split WhatsApp into internal operations and customer orders.

ALTER TABLE kapso_connections
  ADD COLUMN IF NOT EXISTS connection_type TEXT NOT NULL DEFAULT 'internal'
  CHECK (connection_type IN ('internal', 'customer'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kapso_connections_user_id_key'
      AND conrelid = 'kapso_connections'::regclass
  ) THEN
    ALTER TABLE kapso_connections DROP CONSTRAINT kapso_connections_user_id_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS kapso_connections_user_type_key
  ON kapso_connections(user_id, connection_type);

CREATE TABLE IF NOT EXISTS kapso_orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id      UUID REFERENCES kapso_connections(id) ON DELETE SET NULL,
  customer_phone     TEXT,
  customer_name      TEXT,
  status             TEXT NOT NULL DEFAULT 'needs_details'
                     CHECK (status IN ('needs_details', 'confirmed', 'cancelled', 'fulfilled')),
  items              JSONB NOT NULL DEFAULT '[]'::jsonb,
  delivery_address   TEXT,
  payment_method     TEXT,
  notes              TEXT,
  raw_text           TEXT,
  source_message_id  TEXT,
  confirmed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kapso_orders_user_status_idx
  ON kapso_orders(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS kapso_orders_customer_phone_idx
  ON kapso_orders(user_id, customer_phone, created_at DESC);

ALTER TABLE kapso_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own Kapso orders" ON kapso_orders;
CREATE POLICY "Users manage own Kapso orders"
  ON kapso_orders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS kapso_workflow_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id  UUID REFERENCES kapso_connections(id) ON DELETE SET NULL,
  from_number    TEXT,
  request_text   TEXT NOT NULL,
  parsed_intent  JSONB NOT NULL DEFAULT '{}'::jsonb,
  status         TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'converted', 'cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kapso_workflow_requests_user_status_idx
  ON kapso_workflow_requests(user_id, status, created_at DESC);

ALTER TABLE kapso_workflow_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own Kapso workflow requests" ON kapso_workflow_requests;
CREATE POLICY "Users view own Kapso workflow requests"
  ON kapso_workflow_requests FOR SELECT
  USING (auth.uid() = user_id);
