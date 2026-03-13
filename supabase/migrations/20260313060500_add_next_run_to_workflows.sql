-- Add scheduling columns to workflows table
ALTER TABLE public.workflows
ADD COLUMN next_run TIMESTAMPTZ,
ADD COLUMN last_run TIMESTAMPTZ;

CREATE INDEX idx_workflows_next_run ON public.workflows(next_run) WHERE status = 'active';
