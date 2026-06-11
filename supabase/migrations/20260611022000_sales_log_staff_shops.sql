CREATE TABLE IF NOT EXISTS business_shops (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  aliases    TEXT[] NOT NULL DEFAULT '{}',
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE UNIQUE INDEX IF NOT EXISTS business_shops_user_name_key
  ON business_shops(user_id, lower(name));

CREATE INDEX IF NOT EXISTS business_shops_user_active_idx
  ON business_shops(user_id, active, name);

ALTER TABLE business_shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own shops" ON business_shops;
CREATE POLICY "Users manage own shops"
  ON business_shops FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS business_staff (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  aliases      TEXT[] NOT NULL DEFAULT '{}',
  default_shop TEXT,
  active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE UNIQUE INDEX IF NOT EXISTS business_staff_user_name_key
  ON business_staff(user_id, lower(name));

CREATE INDEX IF NOT EXISTS business_staff_user_active_idx
  ON business_staff(user_id, active, name);

ALTER TABLE business_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own staff" ON business_staff;
CREATE POLICY "Users manage own staff"
  ON business_staff FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS kapso_sales_log_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id  UUID REFERENCES kapso_connections(id) ON DELETE SET NULL,
  from_number    TEXT NOT NULL,
  pending_rows   JSONB NOT NULL DEFAULT '[]'::jsonb,
  missing_fields TEXT[] NOT NULL DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'awaiting_context'
                 CHECK (status IN ('awaiting_context', 'completed', 'cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 minutes'
);

CREATE UNIQUE INDEX IF NOT EXISTS kapso_sales_log_sessions_one_active_idx
  ON kapso_sales_log_sessions(user_id, from_number)
  WHERE status = 'awaiting_context';

CREATE INDEX IF NOT EXISTS kapso_sales_log_sessions_user_status_idx
  ON kapso_sales_log_sessions(user_id, status, updated_at DESC);

ALTER TABLE kapso_sales_log_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own sales log sessions" ON kapso_sales_log_sessions;
CREATE POLICY "Users view own sales log sessions"
  ON kapso_sales_log_sessions FOR SELECT
  USING (auth.uid() = user_id);
