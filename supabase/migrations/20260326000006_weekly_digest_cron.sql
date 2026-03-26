-- Weekly digest: every Monday at 08:00 UTC
SELECT cron.schedule(
  'telegram-weekly-digest-monday',
  '0 8 * * 1',
  $$
    SELECT net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/telegram-weekly-digest',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
