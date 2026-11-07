/*
  # Remove Customer Signature Column

  1. Changes
    - Remove `customer_signature` column from `site_surveys` table
    - This field is no longer needed per user requirement
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'site_surveys' AND column_name = 'customer_signature'
  ) THEN
    ALTER TABLE site_surveys DROP COLUMN customer_signature;
  END IF;
END $$;