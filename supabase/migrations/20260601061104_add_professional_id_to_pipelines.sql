/*
  # Add professional_id to installation and complaint pipelines

  1. Changes
    - `installation_pipeline`: add `professional_id` (uuid, nullable FK to architects)
    - `complaint_pipeline`: add `professional_id` (uuid, nullable FK to architects)
  2. Notes
    - Nullable so existing records are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'installation_pipeline' AND column_name = 'professional_id'
  ) THEN
    ALTER TABLE installation_pipeline ADD COLUMN professional_id uuid REFERENCES architects(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaint_pipeline' AND column_name = 'professional_id'
  ) THEN
    ALTER TABLE complaint_pipeline ADD COLUMN professional_id uuid REFERENCES architects(id) ON DELETE SET NULL;
  END IF;
END $$;
