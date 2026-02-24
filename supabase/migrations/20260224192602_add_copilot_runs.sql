-- Add copilot_runs counter to profiles table (defaulting to 5 for free users)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS copilot_runs INTEGER DEFAULT 5;

-- Update existing profiles that might have null if added previously
UPDATE public.profiles
SET copilot_runs = 5
WHERE copilot_runs IS NULL;

-- Ensure RLS policies don't block the edge function from reading/updating this using service role
