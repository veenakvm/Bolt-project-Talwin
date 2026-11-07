/*
  # Add button_link field to pricing_plans table

  1. Changes
    - Add `button_link` column to pricing_plans table to store clickable URLs for the SELECT/CONTACT SALES buttons
    - This allows each pricing plan to have a configurable link for payments or contact forms

  2. Notes
    - The button_link is optional (can be null)
    - Links can point to payment pages, contact forms, or any external URL
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pricing_plans' AND column_name = 'button_link'
  ) THEN
    ALTER TABLE pricing_plans ADD COLUMN button_link text;
  END IF;
END $$;