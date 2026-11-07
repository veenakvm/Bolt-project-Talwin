/*
  # Add updated_at column to quotations table

  The quotations table is missing the updated_at column which causes an error
  when editing/saving quotations. This migration adds the column with a default
  value of the current timestamp.

  1. Changes
    - Add `updated_at` (timestamptz) column to quotations table, defaulting to now()
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE quotations ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;
