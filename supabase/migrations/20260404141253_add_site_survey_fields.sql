/*
  # Add Site Survey Fields to Sales Pipeline

  ## Changes
  - Add `site_survey_date` column to store the date when site survey is planned (when site_survey_planned = 'Yes')
  - Add `targeted_date` column to store the targeted date (when site_survey_planned = 'No')
  - Add `technician_comments` column to store technician input (when site_survey_planned = 'No')

  ## Notes
  - These fields support conditional logic based on site_survey_planned status
  - All fields are optional (nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_pipeline' AND column_name = 'site_survey_date'
  ) THEN
    ALTER TABLE sales_pipeline ADD COLUMN site_survey_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_pipeline' AND column_name = 'targeted_date'
  ) THEN
    ALTER TABLE sales_pipeline ADD COLUMN targeted_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_pipeline' AND column_name = 'technician_comments'
  ) THEN
    ALTER TABLE sales_pipeline ADD COLUMN technician_comments text DEFAULT '';
  END IF;
END $$;