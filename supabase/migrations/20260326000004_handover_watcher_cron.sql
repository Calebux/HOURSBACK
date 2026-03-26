-- Schedule the handover watcher to run every hour (checks shift_end_time per workspace)
SELECT cron.schedule(
  'telegram-handover-watcher-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/telegram-handover-watcher',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
