-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule execute-watchers to run every hour
-- In local dev, edge functions are reachable from the DB container via host.docker.internal
-- In production, replace the URL with your actual Supabase project URL
SELECT cron.schedule(
  'execute-watchers-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'http://host.docker.internal:54321/functions/v1/execute-watchers',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
