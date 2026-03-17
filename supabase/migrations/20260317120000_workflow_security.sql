-- =============================================================
-- WORKFLOW SECURITY MIGRATION
-- Free-tier limit trigger, webhook secrets, is_pro flag
-- =============================================================

-- pgcrypto needed for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ---------------------------------------------------------------
-- 1. Add is_pro flag to workflows
-- Stored at insert time so the edge function can enforce it
-- even if the user later downgrades.
-- ---------------------------------------------------------------
ALTER TABLE public.workflows
  ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------
-- 2. Add auto-generated webhook_secret to every workflow
-- Used to authenticate incoming webhook calls — the caller must
-- pass ?secret=<value> matching this column.
-- ---------------------------------------------------------------
ALTER TABLE public.workflows
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT NOT NULL
    DEFAULT encode(extensions.gen_random_bytes(32), 'hex');

-- Backfill any NULLs (shouldn't happen with DEFAULT, but be safe)
UPDATE public.workflows
  SET webhook_secret = encode(extensions.gen_random_bytes(32), 'hex')
  WHERE webhook_secret IS NULL;

-- ---------------------------------------------------------------
-- 3. DB-level free-tier workflow limit (3 max for free users)
-- Enforced on every INSERT regardless of client — cannot be
-- bypassed by calling the Supabase API directly.
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION enforce_workflow_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_count  INTEGER;
BEGIN
  SELECT subscription_status INTO v_status
    FROM profiles WHERE id = NEW.user_id;

  -- Only restrict free / null subscription users
  IF v_status IS DISTINCT FROM 'pro' THEN
    SELECT COUNT(*) INTO v_count
      FROM workflows WHERE user_id = NEW.user_id;

    IF v_count >= 3 THEN
      RAISE EXCEPTION
        'Free plan is limited to 3 workflows. Upgrade to Pro to deploy more.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if it already exists, then recreate cleanly
DROP TRIGGER IF EXISTS enforce_workflow_limit_trigger ON public.workflows;

CREATE TRIGGER enforce_workflow_limit_trigger
  BEFORE INSERT ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION enforce_workflow_limit();
