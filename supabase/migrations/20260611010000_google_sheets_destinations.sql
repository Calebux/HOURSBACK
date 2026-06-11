CREATE TABLE IF NOT EXISTS google_sheet_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  spreadsheet_id TEXT NOT NULL,
  sheet_name TEXT NOT NULL DEFAULT 'Sales Log',
  enabled BOOLEAN NOT NULL DEFAULT true,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE google_sheet_destinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own Google Sheet destination" ON google_sheet_destinations;
CREATE POLICY "Users can view own Google Sheet destination"
  ON google_sheet_destinations FOR SELECT
  USING (auth.uid() = user_id);
