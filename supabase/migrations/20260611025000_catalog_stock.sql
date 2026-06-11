CREATE TABLE IF NOT EXISTS business_catalog_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  aliases       TEXT[] NOT NULL DEFAULT '{}',
  category      TEXT,
  unit_price    NUMERIC,
  stock_qty     NUMERIC,
  reorder_point NUMERIC,
  track_stock   BOOLEAN NOT NULL DEFAULT FALSE,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS business_catalog_items_user_name_key
  ON business_catalog_items(user_id, lower(name));

CREATE INDEX IF NOT EXISTS business_catalog_items_user_active_idx
  ON business_catalog_items(user_id, active, name);

CREATE TABLE IF NOT EXISTS business_stock_movements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_item_id UUID REFERENCES business_catalog_items(id) ON DELETE SET NULL,
  movement_type   TEXT NOT NULL CHECK (movement_type IN ('sale', 'refund', 'restock', 'adjustment')),
  qty_delta       NUMERIC NOT NULL,
  source_entry_id UUID REFERENCES bot_entries(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS business_stock_movements_user_created_idx
  ON business_stock_movements(user_id, created_at DESC);

ALTER TABLE business_catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own catalog items" ON business_catalog_items;
CREATE POLICY "Users manage own catalog items"
  ON business_catalog_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own stock movements" ON business_stock_movements;
CREATE POLICY "Users manage own stock movements"
  ON business_stock_movements FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
