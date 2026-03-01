-- Add playbook_data column to store the full playbook recipe for autonomous execution
ALTER TABLE public.scheduled_playbooks 
ADD COLUMN IF NOT EXISTS playbook_data JSONB DEFAULT '{}'::jsonb;

-- Comment to explain the column
COMMENT ON COLUMN public.scheduled_playbooks.playbook_data IS 'Stores the full playbook definition (steps, title, etc) at the time of scheduling to ensure consistent autonomous execution.';
