-- Create workflows table
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    data_source_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    agent_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    learning_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Note: `trigger_config` could include { type: 'schedule', cron: '0 * * * *' } or { type: 'webhook' }
-- Note: `data_source_config` might represent integrations.
-- Note: `agent_config` contains prompts.
-- Note: `action_config` might contain email dest.

-- Create workflow_runs table
CREATE TABLE IF NOT EXISTS public.workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    generated_output TEXT,
    error_message TEXT,
    execution_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

-- Workflows policies
CREATE POLICY "Users can view their own workflows"
    ON public.workflows FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workflows"
    ON public.workflows FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
    ON public.workflows FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workflows"
    ON public.workflows FOR DELETE
    USING (auth.uid() = user_id);

-- Workflow runs policies
CREATE POLICY "Users can view their own workflow runs"
    ON public.workflow_runs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workflow runs"
    ON public.workflow_runs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger for workflows
CREATE OR REPLACE FUNCTION update_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflows_timestamp
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_workflows_updated_at();

-- Add Indexes for faster querying
CREATE INDEX workflows_user_id_idx ON public.workflows(user_id);
CREATE INDEX workflow_runs_workflow_id_idx ON public.workflow_runs(workflow_id);
CREATE INDEX workflow_runs_user_id_idx ON public.workflow_runs(user_id);
