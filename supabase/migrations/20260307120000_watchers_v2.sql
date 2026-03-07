-- Watchers V2: schema improvements + cron scheduling

-- 1. Add missing columns to watcher_logs
ALTER TABLE public.watcher_logs
  ADD COLUMN IF NOT EXISTS analysis_text TEXT,
  ADD COLUMN IF NOT EXISTS error_message  TEXT;

-- 2. Add next_run to watchers (so edge function can filter by schedule)
ALTER TABLE public.watchers
  ADD COLUMN IF NOT EXISTS next_run TIMESTAMPTZ;

-- Backfill: set next_run = NOW() for all existing active watchers so they
-- are picked up on the next cron tick
UPDATE public.watchers
  SET next_run = NOW()
  WHERE next_run IS NULL AND status = 'active';

-- 3. Enable pg_net for outbound HTTP calls from the database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 4. Schedule the execute-watchers edge function every 30 minutes.
--    pg_net.http_post() is non-blocking — the cron job completes instantly.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hoursback-watcher-runner') THEN
    PERFORM cron.unschedule('hoursback-watcher-runner');
  END IF;
END;
$$;

SELECT cron.schedule(
  'hoursback-watcher-runner',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://tsooqmbrxquybqcuqcby.supabase.co/functions/v1/execute-watchers',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzb29xbWJyeHF1eWJxY3VxY2J5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg3MDE2NCwiZXhwIjoyMDg3NDQ2MTY0fQ.aDn6JIp5kytR8Hh4_rnlW32O7TSsNl4_frW5vHG5QgY"}'::jsonb,
    body    := '{"trigger":"cron"}'::jsonb
  );
  $$
);
