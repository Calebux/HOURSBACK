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
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzb29xbWJyeHF1eWJxY3VxY2J5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg3MDE2NCwiZXhwIjoyMDg3NDQ2MTY0fQ.aDn6JIp5kytR8Hh4_rnlW32O7TSsNl4_frW5vHG5QgY"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
