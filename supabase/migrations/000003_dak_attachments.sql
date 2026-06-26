-- Storage bucket for DAK attachments (metadata lives in public.attachments)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dak-attachments',
  'dak-attachments',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Optional: if an older dak_attachments table was created without mime_type,
-- add the missing column so legacy scripts still work.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'dak_attachments'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dak_attachments'
      AND column_name = 'mime_type'
  ) THEN
    ALTER TABLE public.dak_attachments
      ADD COLUMN mime_type text;
  END IF;
END $$;
