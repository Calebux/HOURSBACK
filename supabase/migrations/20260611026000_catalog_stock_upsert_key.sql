CREATE UNIQUE INDEX IF NOT EXISTS business_catalog_items_user_name_exact_key
  ON business_catalog_items(user_id, name);
