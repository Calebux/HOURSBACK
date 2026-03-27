-- Fix: telegram_runs INSERT policy was WITH CHECK (true), allowing any
-- authenticated user to insert rows with an arbitrary user_id (spoofing).
--
-- The edge function uses the service role key, which bypasses RLS entirely,
-- so it can still insert freely. Dropping this policy leaves INSERT blocked
-- for all non-service-role callers (default DENY when no policy matches).
--
-- UPDATE and DELETE had no policies, so they were already DENY for
-- authenticated users — no change needed there.

DROP POLICY IF EXISTS "Service role insert telegram runs" ON telegram_runs;
