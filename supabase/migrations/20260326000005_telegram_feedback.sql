-- Add feedback column to telegram_runs
ALTER TABLE telegram_runs
  ADD COLUMN IF NOT EXISTS feedback TEXT CHECK (feedback IN ('helpful', 'not_helpful'));
