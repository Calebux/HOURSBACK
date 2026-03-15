-- Audit trail for every workflow execution
create table if not exists job_runs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  playbook_id text not null,
  status text not null check (status in ('running', 'success', 'error')),
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Index for user lookups and recent runs
create index if not exists job_runs_user_id_idx on job_runs (user_id);
create index if not exists job_runs_created_at_idx on job_runs (created_at desc);

-- RLS: users can only see their own runs
alter table job_runs enable row level security;

create policy "Users can view own job runs"
  on job_runs for select
  using (auth.uid() = user_id);

create policy "Service role can insert job runs"
  on job_runs for insert
  with check (true);

create policy "Service role can update job runs"
  on job_runs for update
  using (true);
