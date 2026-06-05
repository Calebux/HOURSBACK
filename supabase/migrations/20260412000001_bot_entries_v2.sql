-- Add sale_date and source columns to bot_entries
-- sale_date: the date visible on the ledger page (may differ from created_at)
-- source: how the entry was created — telegram_text | telegram_photo | web_upload

ALTER TABLE bot_entries
  ADD COLUMN IF NOT EXISTS sale_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source    TEXT DEFAULT 'telegram_text';
