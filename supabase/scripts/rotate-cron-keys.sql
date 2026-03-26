-- =============================================================
-- CRON KEY ROTATION SCRIPT
-- Run this in the Supabase SQL editor after rotating your
-- service role JWT in: Dashboard → Settings → API → Rotate JWT
--
-- Replace <NEW_SERVICE_ROLE_JWT> with the new token before running.
-- =============================================================

-- 1. Autopilot cron job
SELECT cron.unschedule('hoursback-autopilot-runner');
SELECT cron.schedule(
  'hoursback-autopilot-runner',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://tsooqmbrxquybqcuqcby.supabase.co/functions/v1/execute-scheduled-playbooks',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <NEW_SERVICE_ROLE_JWT>"}'::jsonb,
    body    := '{"trigger":"cron"}'::jsonb
  );
  $$
);

-- 2. Renewal cron job
SELECT cron.unschedule('hoursback-renewal-cron');
SELECT cron.schedule(
  'hoursback-renewal-cron',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://tsooqmbrxquybqcuqcby.supabase.co/functions/v1/subscription-renewal-cron',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <NEW_SERVICE_ROLE_JWT>"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- 3. Watcher runner cron job
SELECT cron.unschedule('hoursback-watcher-runner');
SELECT cron.schedule(
  'hoursback-watcher-runner',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://tsooqmbrxquybqcuqcby.supabase.co/functions/v1/execute-watchers',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <NEW_SERVICE_ROLE_JWT>"}'::jsonb,
    body    := '{"trigger":"cron"}'::jsonb
  );
  $$
);
