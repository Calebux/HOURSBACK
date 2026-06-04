-- WhatsApp end-of-day closeout workflow.
-- Staff can send "close day", then submit cash/POS/transfer/expenses totals.

CREATE TABLE IF NOT EXISTS kapso_closeout_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES kapso_connections(id) ON DELETE SET NULL,
  from_number   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'awaiting_closeout'
                CHECK (status IN ('awaiting_closeout', 'completed', 'cancelled')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '12 hours'
);

CREATE UNIQUE INDEX IF NOT EXISTS kapso_closeout_sessions_one_active_idx
  ON kapso_closeout_sessions(user_id, from_number)
  WHERE status = 'awaiting_closeout';

CREATE INDEX IF NOT EXISTS kapso_closeout_sessions_user_status_idx
  ON kapso_closeout_sessions(user_id, status, updated_at DESC);

ALTER TABLE kapso_closeout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own Kapso closeout sessions" ON kapso_closeout_sessions;
CREATE POLICY "Users view own Kapso closeout sessions"
  ON kapso_closeout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS kapso_closeouts (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id            UUID REFERENCES kapso_connections(id) ON DELETE SET NULL,
  from_number              TEXT,
  staff_name               TEXT,
  business_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_sales_total     NUMERIC NOT NULL DEFAULT 0,
  expected_expenses_total  NUMERIC NOT NULL DEFAULT 0,
  cash_total               NUMERIC NOT NULL DEFAULT 0,
  pos_total                NUMERIC NOT NULL DEFAULT 0,
  transfer_total           NUMERIC NOT NULL DEFAULT 0,
  expenses_total           NUMERIC NOT NULL DEFAULT 0,
  actual_collected_total   NUMERIC NOT NULL DEFAULT 0,
  variance_total           NUMERIC NOT NULL DEFAULT 0,
  status                   TEXT NOT NULL DEFAULT 'balanced'
                           CHECK (status IN ('balanced', 'review_needed', 'short', 'over')),
  notes                    TEXT,
  raw_text                 TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kapso_closeouts_user_date_idx
  ON kapso_closeouts(user_id, business_date DESC, created_at DESC);

ALTER TABLE kapso_closeouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own Kapso closeouts" ON kapso_closeouts;
CREATE POLICY "Users view own Kapso closeouts"
  ON kapso_closeouts FOR SELECT
  USING (auth.uid() = user_id);
