/*
  # Add Advance Payment to Invoices

  1. Changes
    - Add `advance_paid` column to invoices table (numeric, default 0)
    - Add `balance_due` column to invoices table (numeric, default 0)

  2. Notes
    - advance_paid stores the amount already paid
    - balance_due = grand_total - advance_paid (calculated)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'advance_paid'
  ) THEN
    ALTER TABLE invoices ADD COLUMN advance_paid numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'balance_due'
  ) THEN
    ALTER TABLE invoices ADD COLUMN balance_due numeric(10,2) DEFAULT 0;
  END IF;
END $$;
