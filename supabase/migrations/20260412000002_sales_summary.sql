-- Allow users to delete their own bot_entries
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
CREATE POLICY "Service role manages sales summary checks"
  ON sales_summary_checks FOR ALL USING (true);

-- Opt-in column on telegram_bots (default on so existing users get it)
ALTER TABLE telegram_bots
  ADD COLUMN IF NOT EXISTS sales_summary_enabled BOOLEAN DEFAULT true;

-- Hourly cron — same pattern as handover watcher
SELECT cron.schedule(
  'telegram-sales-summary-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/telegram-sales-summary',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
