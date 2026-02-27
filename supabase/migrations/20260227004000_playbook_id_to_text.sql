-- Change playbook_id from UUID to TEXT to support local playbook IDs like 'cwp-1', 'smb-1', etc.
-- This enables save/progress tracking for all playbooks, not just DB-stored ones.

ALTER TABLE public.saved_playbooks
ALTER COLUMN playbook_id TYPE TEXT;

ALTER TABLE public.playbook_progress
ALTER COLUMN playbook_id TYPE TEXT;
