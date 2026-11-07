/*
  # Add E-way Bill and Address Fields
  
  1. Changes to invoices table
    - Add `eway_bill_number` (text, nullable)
    - Add `customer_address` (text, nullable)
    - Add `billing_address` (text, nullable)
  
  2. Changes to quotations table
    - Add `customer_address` (text, nullable)
    - Add `billing_address` (text, nullable)
  
  3. Security
    - No RLS changes needed (tables already have RLS enabled)
*/

DO $$
BEGIN
  -- Add fields to invoices table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'eway_bill_number'
  ) THEN
    ALTER TABLE invoices ADD COLUMN eway_bill_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'customer_address'
  ) THEN
    ALTER TABLE invoices ADD COLUMN customer_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'billing_address'
  ) THEN
    ALTER TABLE invoices ADD COLUMN billing_address text;
  END IF;

  -- Add fields to quotations table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'customer_address'
  ) THEN
    ALTER TABLE quotations ADD COLUMN customer_address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'billing_address'
  ) THEN
    ALTER TABLE quotations ADD COLUMN billing_address text;
  END IF;
END $$;