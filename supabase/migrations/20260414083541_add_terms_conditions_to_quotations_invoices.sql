/*
  # Add Terms & Conditions to Quotations and Invoices

  1. Changes
    - `quotations` table: Add `terms_conditions` (text, nullable) column
    - `invoices` table: Add `terms_conditions` (text, nullable) column

  2. Notes
    - Allows users to customize T&C per document
    - Falls back to default T&C in PDFs if empty
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'terms_conditions'
  ) THEN
    ALTER TABLE quotations ADD COLUMN terms_conditions text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'terms_conditions'
  ) THEN
    ALTER TABLE invoices ADD COLUMN terms_conditions text DEFAULT '';
  END IF;
END $$;
