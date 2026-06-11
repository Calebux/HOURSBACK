ALTER TABLE google_sheet_destinations
  ADD COLUMN IF NOT EXISTS refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS token_type TEXT DEFAULT 'Bearer';
