ALTER TABLE google_sheet_destinations
  ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'oauth';

UPDATE google_sheet_destinations
SET auth_method = 'oauth'
WHERE auth_method IS NULL;
