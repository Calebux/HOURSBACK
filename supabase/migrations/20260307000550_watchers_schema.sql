-- Create Watchers table
CREATE TABLE public.watchers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    data_source_type TEXT NOT NULL CHECK (data_source_type IN ('google_sheets', 'csv', 'api')),
    data_source_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    condition_prompt TEXT NOT NULL,
    ai_prompt TEXT NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('email', 'dashboard')),
    schedule TEXT NOT NULL, -- Cron expression or 'daily', 'weekly', etc.
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    last_run TIMESTAMPTZ,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Watcher Logs table
CREATE TABLE public.watcher_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    watcher_id UUID NOT NULL REFERENCES public.watchers(id) ON DELETE CASCADE,
    triggered BOOLEAN NOT NULL DEFAULT false,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watcher_logs ENABLE ROW LEVEL SECURITY;

-- Policies for Watchers
CREATE POLICY "Users can view their own watchers"
    ON public.watchers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watchers"
    ON public.watchers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchers"
    ON public.watchers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchers"
    ON public.watchers FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for Watcher Logs
CREATE POLICY "Users can view logs for their own watchers"
    ON public.watcher_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.watchers
            WHERE id = watcher_logs.watcher_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert logs for their own watchers"
    ON public.watcher_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.watchers
            WHERE id = watcher_logs.watcher_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update logs for their own watchers"
    ON public.watcher_logs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.watchers
            WHERE id = watcher_logs.watcher_id
            AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.watchers
            WHERE id = watcher_logs.watcher_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete logs for their own watchers"
    ON public.watcher_logs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.watchers
            WHERE id = watcher_logs.watcher_id
            AND user_id = auth.uid()
        )
    );

-- Add updated_at trigger for watchers
CREATE OR REPLACE FUNCTION update_watchers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_watchers_updated_at
    BEFORE UPDATE ON public.watchers
    FOR EACH ROW
    EXECUTE FUNCTION update_watchers_updated_at();
