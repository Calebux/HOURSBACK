-- Launch readiness hardening:
-- - idempotently sync verified WhatsApp customer requests into the Sales Log
-- - allow authenticated users to insert/update their own bot_entries from the app
-- - store server-side analytics milestones for webhook/order/payment events

ALTER TABLE bot_entries
  ADD COLUMN IF NOT EXISTS source_order_id UUID REFERENCES kapso_orders(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bot_entries_source_order_id_key
  ON bot_entries(source_order_id)
  WHERE source_order_id IS NOT NULL;

DROP POLICY IF EXISTS "Users can insert own entries" ON bot_entries;
CREATE POLICY "Users can insert own entries"
  ON bot_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own entries" ON bot_entries;
CREATE POLICY "Users can update own entries"
  ON bot_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS app_analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name  TEXT NOT NULL,
  properties  JSONB NOT NULL DEFAULT '{}'::jsonb,
  source      TEXT NOT NULL DEFAULT 'server',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_analytics_events_user_event_idx
  ON app_analytics_events(user_id, event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS app_analytics_events_event_created_idx
  ON app_analytics_events(event_name, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS workflows_one_whatsapp_reports_workflow_per_user_idx
  ON workflows(user_id)
  WHERE name = 'WhatsApp Reports'
    AND category = 'WhatsApp Report';

ALTER TABLE app_analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own analytics events" ON app_analytics_events;
CREATE POLICY "Users view own analytics events"
  ON app_analytics_events FOR SELECT
  USING (auth.uid() = user_id);
