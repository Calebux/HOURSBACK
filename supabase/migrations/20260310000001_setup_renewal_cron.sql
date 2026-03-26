-- Enable pg_net if not already enabled
create extension if not exists pg_net with schema extensions;

-- Remove existing job if it exists
do $$
begin
  if exists (select 1 from cron.job where jobname = 'hoursback-renewal-cron') then
    perform cron.unschedule('hoursback-renewal-cron');
  end if;
end;
$$;

-- Run daily at 8 AM UTC — checks for expiring and expired Pro subscriptions
select cron.schedule(
  'hoursback-renewal-cron',
  '0 8 * * *',
  $$
  select net.http_post(
    url     := 'https://tsooqmbrxquybqcuqcby.supabase.co/functions/v1/subscription-renewal-cron',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY_REDACTED>"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
