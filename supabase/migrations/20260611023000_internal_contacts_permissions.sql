CREATE TABLE IF NOT EXISTS business_internal_contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  phone_number      TEXT NOT NULL,
  role              TEXT NOT NULL DEFAULT 'staff'
                    CHECK (role IN ('owner', 'manager', 'staff')),
  can_log_sales     BOOLEAN NOT NULL DEFAULT TRUE,
  can_query_reports BOOLEAN NOT NULL DEFAULT FALSE,
  can_closeout      BOOLEAN NOT NULL DEFAULT FALSE,
  can_manage_setup  BOOLEAN NOT NULL DEFAULT FALSE,
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, phone_number)
);

CREATE INDEX IF NOT EXISTS business_internal_contacts_user_active_idx
  ON business_internal_contacts(user_id, active, phone_number);

ALTER TABLE business_internal_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own internal contacts" ON business_internal_contacts;
CREATE POLICY "Users manage own internal contacts"
  ON business_internal_contacts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
