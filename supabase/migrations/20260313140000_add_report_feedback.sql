-- Add feedback column to workflow_runs
ALTER TABLE workflow_runs
  ADD COLUMN IF NOT EXISTS feedback TEXT CHECK (feedback IN ('helpful', 'not_helpful', 'too_vague'));
