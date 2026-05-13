-- =============================================================
-- CRON KEY ROTATION SCRIPT
-- Run this in the Supabase SQL editor after rotating your
-- service role JWT in: Dashboard → Settings → API → Rotate JWT
--
-- Replace <NEW_SERVICE_ROLE_JWT> with the new token before running.
-- =============================================================

-- 1. Autopilot cron job
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hoursback-autopilot-runner') THEN
    PERFORM cron.unschedule('hoursback-autopilot-runner');
  END IF;
END;
$$;
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
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hoursback-renewal-cron') THEN
    PERFORM cron.unschedule('hoursback-renewal-cron');
  END IF;
END;
$$;
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
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hoursback-watcher-runner') THEN
    PERFORM cron.unschedule('hoursback-watcher-runner');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hoursback-workflow-worker') THEN
    PERFORM cron.unschedule('hoursback-workflow-worker');
  END IF;
END;
$$;
SELECT cron.schedule(
  'hoursback-watcher-runner',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://tsooqmbrxquybqcuqcby.supabase.co/functions/v1/execute-watchers',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <NEW_SERVICE_ROLE_JWT>"}'::jsonb,
    body    := '{"trigger":"cron"}'::jsonb
  );
  $$
);

-- 4. Workflow queue worker cron job
SELECT cron.schedule(
  'hoursback-workflow-worker',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://tsooqmbrxquybqcuqcby.supabase.co/functions/v1/process-workflow-jobs',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <NEW_SERVICE_ROLE_JWT>"}'::jsonb,
    body    := '{"trigger":"cron"}'::jsonb
  );
  $$
);
