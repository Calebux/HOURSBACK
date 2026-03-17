-- =============================================================
-- SECURITY HARDENING MIGRATION
-- Rate limiting, idempotency, and RLS policy corrections
-- =============================================================

-- ---------------------------------------------------------------
-- 1. RATE LIMITS TABLE
-- Stores per-key (IP or user) request counts per time window.
-- No user policies = only accessible via service role key.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT        NOT NULL PRIMARY KEY,
  count        INTEGER     NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
-- No RLS policies — inaccessible to anon/authenticated keys.
-- Service role (used by edge functions) bypasses RLS.

-- ---------------------------------------------------------------
-- 2. ATOMIC RATE-LIMIT CHECK (called from edge functions)
-- Upserts a counter for the key. Resets when the window expires.
-- Returns: { allowed: bool, remaining: int, count: int }
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key            TEXT,
  p_limit          INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count        INTEGER;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  INSERT INTO rate_limits (key, count, window_start)
  VALUES (p_key, 1, NOW())
  ON CONFLICT (key) DO UPDATE
    SET
      count = CASE
        WHEN rate_limits.window_start < v_window_start THEN 1
        ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < v_window_start THEN NOW()
        ELSE rate_limits.window_start
      END
  RETURNING count INTO v_count;

  RETURN jsonb_build_object(
    'allowed',   v_count <= p_limit,
    'remaining', GREATEST(0, p_limit - v_count),
    'count',     v_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

-- ---------------------------------------------------------------
-- 3. PROCESSED PAYMENTS (idempotency for Flutterwave webhooks)
-- Prevents the same transaction from being credited twice.
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS processed_payments (
  tx_ref       TEXT        PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users ON DELETE SET NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE processed_payments ENABLE ROW LEVEL SECURITY;
-- No policies — service role only.

-- ---------------------------------------------------------------
-- 4. FIX job_runs INSERT / UPDATE POLICIES
-- The original policies used `with check (true)` / `using (true)`
-- which lets any authenticated user insert/update any row.
-- Correct them to enforce user ownership.
-- ---------------------------------------------------------------
DROP POLICY IF EXISTS "Service role can insert job runs" ON job_runs;
DROP POLICY IF EXISTS "Service role can update job runs" ON job_runs;

-- Service role bypasses RLS; these policies protect authenticated users.
CREATE POLICY "Users can insert own job runs"
  ON job_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job runs"
  ON job_runs FOR UPDATE
  USING (auth.uid() = user_id);
