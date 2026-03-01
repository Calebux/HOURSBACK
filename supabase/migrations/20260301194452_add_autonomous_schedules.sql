-- Add the required pg_cron extension if not already present
create extension if not exists pg_cron;

-- Create the scheduled_playbooks table
create table if not exists public.scheduled_playbooks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  playbook_slug text not null,
  variables jsonb default '{}'::jsonb not null,
  cron_expression text not null, -- e.g. "0 8 * * 1"
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.scheduled_playbooks enable row level security;

-- Create policies for scheduled_playbooks
create policy "Users can view their own scheduled playbooks"
  on public.scheduled_playbooks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own scheduled playbooks"
  on public.scheduled_playbooks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own scheduled playbooks"
  on public.scheduled_playbooks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own scheduled playbooks"
  on public.scheduled_playbooks for delete
  using (auth.uid() = user_id);

-- Create the autonomous_runs table to track execution history
create table if not exists public.autonomous_runs (
  id uuid default gen_random_uuid() primary key,
  schedule_id uuid references public.scheduled_playbooks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  playbook_slug text not null,
  generated_content text,
  run_status text not null check (run_status in ('success', 'failed')),
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.autonomous_runs enable row level security;

-- Create policies for autonomous_runs
create policy "Users can view their own autonomous runs"
  on public.autonomous_runs for select
  using (auth.uid() = user_id);

-- Only backend functions should insert/update runs, so no insert/update RLS needed for regular users
-- except maybe letting edge functions override if we were using service_role. 
-- For safety, we keep insert/update blocked from standard anon/authenticated users.

-- Create an index to quickly pull a user's recent runs
create index if not exists idx_autonomous_runs_user_id on public.autonomous_runs(user_id);
create index if not exists idx_scheduled_playbooks_user_id on public.scheduled_playbooks(user_id);
create index if not exists idx_scheduled_playbooks_active on public.scheduled_playbooks(is_active) where is_active = true;
