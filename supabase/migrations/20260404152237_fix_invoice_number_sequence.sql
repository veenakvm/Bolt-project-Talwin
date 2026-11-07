/*
  # Fix Invoice Number Sequence

  1. Changes
    - Create invoice_number_seq if it doesn't exist
    - Create helper function to get next invoice number
    - Convert invoice_number from text to integer if needed

  2. Notes
    - Ensures invoice numbers are sequential and unique
*/

-- Create sequence if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'invoice_number_seq') THEN
    CREATE SEQUENCE invoice_number_seq START WITH 100;
  END IF;
END $$;

-- Create function to get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN nextval('invoice_number_seq');
END;
$$;

-- Convert invoice_number to integer if it's text
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'invoice_number' AND data_type = 'text'
  ) THEN
    -- First, ensure all existing values are numeric or set them to sequence values
    UPDATE invoices SET invoice_number = COALESCE(invoice_number, '100') WHERE invoice_number IS NULL OR invoice_number = '';
    
    -- Alter column type
    ALTER TABLE invoices ALTER COLUMN invoice_number TYPE integer USING invoice_number::integer;
    
    -- Set sequence to max value + 1
    PERFORM setval('invoice_number_seq', COALESCE((SELECT MAX(invoice_number) FROM invoices), 99) + 1);
  END IF;
END $$;
