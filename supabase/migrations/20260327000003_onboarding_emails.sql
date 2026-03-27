-- Track onboarding emails sent to each user
-- email_key values: 'welcome' | 'day2_workflows' | 'day5_telegram' | 'day10_reengage'
CREATE TABLE IF NOT EXISTS onboarding_emails (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_key  TEXT        NOT NULL,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, email_key)
);

ALTER TABLE onboarding_emails ENABLE ROW LEVEL SECURITY;
-- No RLS policies: service role only (edge function uses service role key)

CREATE INDEX onboarding_emails_user_id_idx ON onboarding_emails (user_id);

-- Hourly cron to process onboarding emails
-- Replace <SERVICE_ROLE_KEY> with your actual Supabase service role key before running
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'onboarding-emails-hourly') THEN
    PERFORM cron.unschedule('onboarding-emails-hourly');
  END IF;
END;
$$;

SELECT cron.schedule(
  'onboarding-emails-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://tsooqmbrxquybqcuqcby.supabase.co/functions/v1/onboarding-emails',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
    body    := '{"trigger":"cron"}'::jsonb
  );
  $$
);
