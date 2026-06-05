-- Allow users to delete their own bot_entries
DROP POLICY IF EXISTS "Users can delete own entries" ON bot_entries;
CREATE POLICY "Users can delete own entries"
  ON bot_entries FOR DELETE USING (auth.uid() = user_id);

-- Track daily summary sends to prevent duplicates (same pattern as handover_checks)
CREATE TABLE IF NOT EXISTS sales_summary_checks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sent_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, check_date)
);

ALTER TABLE sales_summary_checks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages sales summary checks" ON sales_summary_checks;
-- No user policies: service role only.

-- Opt-in column on telegram_bots (default on so existing users get it)
ALTER TABLE telegram_bots
  ADD COLUMN IF NOT EXISTS sales_summary_enabled BOOLEAN DEFAULT true;

-- Hourly cron — same pattern as handover watcher
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'telegram-sales-summary-hourly') THEN
    PERFORM cron.unschedule('telegram-sales-summary-hourly');
  END IF;
END;
$$;

SELECT cron.schedule(
  'telegram-sales-summary-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/telegram-sales-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{"trigger":"cron"}'::jsonb
  ) AS request_id;
  $$
);
