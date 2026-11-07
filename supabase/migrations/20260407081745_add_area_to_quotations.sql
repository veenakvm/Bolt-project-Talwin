/*
  # Add Area Field to Quotations

  1. Changes
    - Add `area` column to quotations table (text, NOT NULL)

  2. Notes
    - Area is required for quotations
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'area'
  ) THEN
    ALTER TABLE quotations ADD COLUMN area text NOT NULL DEFAULT '';
  END IF;
END $$;
