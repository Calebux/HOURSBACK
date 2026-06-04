-- Persist WhatsApp receipt media in private Supabase storage for reliable review.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kapso-receipts',
  'kapso-receipts',
  false,
  10485760,
  NULL
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = NULL;

DROP POLICY IF EXISTS "Users read own Kapso receipts" ON storage.objects;
CREATE POLICY "Users read own Kapso receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kapso-receipts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

ALTER TABLE kapso_orders
  ADD COLUMN IF NOT EXISTS receipt_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS receipt_filename TEXT,
  ADD COLUMN IF NOT EXISTS receipt_content_type TEXT;
