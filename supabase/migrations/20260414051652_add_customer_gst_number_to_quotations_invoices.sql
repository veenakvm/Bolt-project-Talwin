/*
  # Add Customer GST Number to Quotations and Invoices

  1. Changes
    - `quotations` table: Add `customer_gst_number` (text, nullable) column
    - `invoices` table: Add `customer_gst_number` (text, nullable) column

  2. Notes
    - Optional field, not all customers will have GST numbers
    - Used for B2B transactions where customer's GSTIN is required
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotations' AND column_name = 'customer_gst_number'
  ) THEN
    ALTER TABLE quotations ADD COLUMN customer_gst_number text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices' AND column_name = 'customer_gst_number'
  ) THEN
    ALTER TABLE invoices ADD COLUMN customer_gst_number text DEFAULT '';
  END IF;
END $$;
