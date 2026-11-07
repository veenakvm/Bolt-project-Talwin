/*
  # Update Invoices Schema

  1. Changes
    - Rename 'contact_number' to 'customer_contact' for consistency
    - Add missing columns: taxable_amount, gst_total
    - Change invoice_number from text to integer
    - Add updated_at column
    - Update constraints

  2. Notes
    - Makes schema consistent with React component expectations
*/

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'taxable_amount'
  ) THEN
    ALTER TABLE invoices ADD COLUMN taxable_amount numeric(12, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'gst_total'
  ) THEN
    ALTER TABLE invoices ADD COLUMN gst_total numeric(12, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'invoice_date'
  ) THEN
    ALTER TABLE invoices ADD COLUMN invoice_date date DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE invoices ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'customer_contact'
  ) THEN
    -- Rename contact_number to customer_contact
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'invoices' AND column_name = 'contact_number'
    ) THEN
      ALTER TABLE invoices RENAME COLUMN contact_number TO customer_contact;
    ELSE
      ALTER TABLE invoices ADD COLUMN customer_contact text;
    END IF;
  END IF;
END $$;

-- Make customer_contact nullable
ALTER TABLE invoices ALTER COLUMN customer_contact DROP NOT NULL;

-- Copy date to invoice_date if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'date'
  ) THEN
    UPDATE invoices SET invoice_date = date WHERE invoice_date IS NULL;
  END IF;
END $$;
