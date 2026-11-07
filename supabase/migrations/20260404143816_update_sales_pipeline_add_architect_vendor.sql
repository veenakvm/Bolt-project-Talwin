/*
  # Update Sales Pipeline with Architect and Vendor References

  ## Changes
  - Add `architect_id` column (uuid, optional foreign key to architects)
  - Add `vendor_id` column (uuid, optional foreign key to vendors)
  - Add `product_id` column (uuid, optional foreign key to products)
  - Remove comments column as it will be replaced by product reference

  ## Notes
  - Using conditional checks to avoid errors if columns already exist or don't exist
*/

DO $$
BEGIN
  -- Add architect_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_pipeline' AND column_name = 'architect_id'
  ) THEN
    ALTER TABLE sales_pipeline ADD COLUMN architect_id uuid REFERENCES architects(id) ON DELETE SET NULL;
  END IF;

  -- Add vendor_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_pipeline' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE sales_pipeline ADD COLUMN vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL;
  END IF;

  -- Add product_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_pipeline' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE sales_pipeline ADD COLUMN product_id uuid REFERENCES products(id) ON DELETE SET NULL;
  END IF;
END $$;