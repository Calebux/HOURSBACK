-- Add custom_delivery_email column to store a dedicated email for agent reports
ALTER TABLE public.scheduled_playbooks 
ADD COLUMN IF NOT EXISTS custom_delivery_email text;

-- Comment to explain the column
COMMENT ON COLUMN public.scheduled_playbooks.custom_delivery_email IS 'Optional dedicated email address where the user wants to receive reports from this specific agent.';
