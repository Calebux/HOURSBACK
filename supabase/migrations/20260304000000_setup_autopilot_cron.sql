-- Enable pg_net for outbound HTTP calls from the database
create extension if not exists pg_net with schema extensions;

-- Safely remove any existing cron job before (re)creating
do $$
begin
  if exists (select 1 from cron.job where jobname = 'hoursback-autopilot-runner') then
    perform cron.unschedule('hoursback-autopilot-runner');
  end if;
end;
$$;

-- Fire the autopilot edge function every minute.
-- pg_net.http_post() is non-blocking — it queues the request and returns immediately,
-- so the cron job completes instantly regardless of how long Claude takes to respond.
select cron.schedule(
  'hoursback-autopilot-runner',
  '* * * * *',
  $$
  select net.http_post(
    url     := 'https://tsooqmbrxquybqcuqcby.supabase.co/functions/v1/execute-scheduled-playbooks',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY_REDACTED>"}'::jsonb,
    body    := '{"trigger":"cron"}'::jsonb
  );
  $$
);
