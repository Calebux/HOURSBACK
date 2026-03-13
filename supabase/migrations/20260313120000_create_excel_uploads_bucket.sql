-- Create storage bucket for Excel file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'excel-uploads',
  'excel-uploads',
  false,
  10485760,
  ARRAY[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Users can upload files into their own folder
CREATE POLICY "Users can upload own excel files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'excel-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own files
CREATE POLICY "Users can read own excel files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'excel-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own files
CREATE POLICY "Users can delete own excel files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'excel-uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
