-- telegram_bots: one per workspace, stores their own bot token
CREATE TABLE IF NOT EXISTS telegram_bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_token TEXT NOT NULL,
  bot_username TEXT,
  bot_name TEXT,
  webhook_registered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE telegram_bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own telegram bot"
  ON telegram_bots FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- telegram_sessions: tracks active multi-step workflow conversations
CREATE TABLE IF NOT EXISTS telegram_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_key TEXT NOT NULL,
  step INTEGER DEFAULT 0,
  collected_inputs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own telegram sessions"
  ON telegram_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
