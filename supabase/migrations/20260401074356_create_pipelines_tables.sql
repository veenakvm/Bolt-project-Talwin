/*
  # Create Pipeline Management Tables

  ## New Tables

  ### sales_pipeline
  Stores sales lead information from field technicians
  - id (uuid, primary key)
  - user_id (uuid, foreign key to auth.users)
  - source (text) - Lead source
  - customer_name (text)
  - phone_number (text)
  - city (text)
  - area (text)
  - site_visit_date (date)
  - quotation_status (text) - Sent or Pending
  - site_survey_planned (text) - Yes or No
  - estimated_value (numeric)
  - comments (text)
  - created_at (timestamptz)

  ### installation_pipeline
  Stores installation tracking information
  - id (uuid, primary key)
  - user_id (uuid, foreign key to auth.users)
  - customer_name (text)
  - phone_number (text)
  - site_survey (text) - Completed or Scheduled
  - site_survey_comments (text)
  - installation_status (text) - Completed or Scheduled
  - site_handed_over (text) - Completed or Scheduled
  - handover_comments (text)
  - created_at (timestamptz)

  ### complaint_pipeline
  Stores customer complaint and service information
  - id (uuid, primary key)
  - user_id (uuid, foreign key to auth.users)
  - customer_name (text)
  - phone_number (text)
  - service_status (text) - Under Warranty, AMC, or Paid
  - complaint_status (text) - Closed or Open
  - complaint_resolution_status (text) - Completed or Scheduled
  - comments (text)
  - vendor_comments (text)
  - created_at (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
*/

-- Create sales_pipeline table
CREATE TABLE IF NOT EXISTS sales_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  source text NOT NULL,
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  city text NOT NULL,
  area text,
  site_visit_date date,
  quotation_status text NOT NULL,
  site_survey_planned text NOT NULL,
  estimated_value numeric DEFAULT 0,
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Create installation_pipeline table
CREATE TABLE IF NOT EXISTS installation_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  site_survey text NOT NULL,
  site_survey_comments text,
  installation_status text NOT NULL,
  site_handed_over text NOT NULL,
  handover_comments text,
  created_at timestamptz DEFAULT now()
);

-- Create complaint_pipeline table
CREATE TABLE IF NOT EXISTS complaint_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  service_status text NOT NULL,
  complaint_status text NOT NULL,
  complaint_resolution_status text NOT NULL,
  comments text,
  vendor_comments text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all pipeline tables
ALTER TABLE sales_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_pipeline ENABLE ROW LEVEL SECURITY;

-- Sales Pipeline Policies
CREATE POLICY "Users can view own sales pipeline data"
  ON sales_pipeline FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales pipeline data"
  ON sales_pipeline FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales pipeline data"
  ON sales_pipeline FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales pipeline data"
  ON sales_pipeline FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Installation Pipeline Policies
CREATE POLICY "Users can view own installation pipeline data"
  ON installation_pipeline FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own installation pipeline data"
  ON installation_pipeline FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own installation pipeline data"
  ON installation_pipeline FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own installation pipeline data"
  ON installation_pipeline FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Complaint Pipeline Policies
CREATE POLICY "Users can view own complaint pipeline data"
  ON complaint_pipeline FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own complaint pipeline data"
  ON complaint_pipeline FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own complaint pipeline data"
  ON complaint_pipeline FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own complaint pipeline data"
  ON complaint_pipeline FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);