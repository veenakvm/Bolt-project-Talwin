/*
  # Add profession column to architects table

  1. Changes
    - `architects` table: add `profession` column (text) with default 'Architect'
      - Stores the type of professional: Architect, Plumber, Contractor, or Electrician
  2. Notes
    - Existing records default to 'Architect' to preserve backward compatibility
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'architects' AND column_name = 'profession'
  ) THEN
    ALTER TABLE architects ADD COLUMN profession text NOT NULL DEFAULT 'Architect';
  END IF;
END $$;
