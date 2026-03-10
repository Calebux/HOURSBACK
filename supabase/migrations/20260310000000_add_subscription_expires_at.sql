-- Add subscription expiry tracking to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Backfill existing Pro users: give them 30 days from now so they don't get
-- immediately downgraded when the cron runs for the first time.
UPDATE public.profiles
SET subscription_expires_at = NOW() + INTERVAL '30 days'
WHERE subscription_status = 'pro'
  AND subscription_expires_at IS NULL;
