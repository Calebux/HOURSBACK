-- Queue-backed workflow execution to avoid long single-cron edge runs

CREATE TABLE IF NOT EXISTS public.workflow_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  run_output TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workflow_jobs_status_scheduled_idx
  ON public.workflow_jobs (status, scheduled_for, created_at);

CREATE INDEX IF NOT EXISTS workflow_jobs_workflow_id_idx
  ON public.workflow_jobs (workflow_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS workflow_jobs_one_open_job_per_workflow_idx
  ON public.workflow_jobs (workflow_id)
  WHERE status IN ('pending', 'running');

ALTER TABLE public.workflow_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own workflow jobs" ON public.workflow_jobs;
CREATE POLICY "Users can view their own workflow jobs"
  ON public.workflow_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_workflow_jobs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workflow_jobs_updated_at_trigger ON public.workflow_jobs;
CREATE TRIGGER workflow_jobs_updated_at_trigger
  BEFORE UPDATE ON public.workflow_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workflow_jobs_updated_at();

CREATE OR REPLACE FUNCTION public.enqueue_due_workflows(p_limit INTEGER DEFAULT 250)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted_count INTEGER := 0;
BEGIN
  WITH due AS (
    SELECT w.id, w.user_id, COALESCE(w.next_run, NOW()) AS scheduled_for
    FROM public.workflows w
    WHERE w.status = 'active'
      AND w.trigger_config->>'type' = 'schedule'
      AND (w.next_run IS NULL OR w.next_run <= NOW())
      AND NOT EXISTS (
        SELECT 1
        FROM public.workflow_jobs j
        WHERE j.workflow_id = w.id
          AND j.status IN ('pending', 'running')
      )
    ORDER BY w.next_run NULLS FIRST, w.created_at
    LIMIT GREATEST(p_limit, 0)
  ), inserted AS (
    INSERT INTO public.workflow_jobs (workflow_id, user_id, status, scheduled_for)
    SELECT id, user_id, 'pending', scheduled_for
    FROM due
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted_count FROM inserted;

  RETURN v_inserted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_workflow_jobs(p_limit INTEGER DEFAULT 12)
RETURNS TABLE (
  id UUID,
  workflow_id UUID,
  user_id UUID,
  attempt_count INTEGER,
  scheduled_for TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.workflow_jobs
  SET
    status = 'pending',
    started_at = NULL,
    updated_at = NOW(),
    error_message = COALESCE(error_message, 'Requeued after stale running job timeout.')
  WHERE status = 'running'
    AND started_at < NOW() - INTERVAL '20 minutes';

  RETURN QUERY
  WITH claimable AS (
    SELECT j.id
    FROM public.workflow_jobs j
    WHERE j.status = 'pending'
      AND j.scheduled_for <= NOW()
    ORDER BY j.scheduled_for, j.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(p_limit, 0)
  )
  UPDATE public.workflow_jobs j
  SET
    status = 'running',
    started_at = NOW(),
    attempt_count = j.attempt_count + 1,
    updated_at = NOW()
  FROM claimable
  WHERE j.id = claimable.id
  RETURNING j.id, j.workflow_id, j.user_id, j.attempt_count, j.scheduled_for;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enqueue_due_workflows(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_workflow_jobs(INTEGER) TO service_role;
