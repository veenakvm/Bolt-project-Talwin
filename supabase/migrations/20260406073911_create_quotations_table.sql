/*
  # Create Quotations Table

  1. New Tables
    - `quotations`
      - `id` (uuid, primary key)
      - `estimate_number` (text, unique) - Quotation/Estimate number
      - `date` (date) - Quotation date
      - `place_of_supply` (text) - State for GST
      - `pipeline_source` (text) - Sales/Installation/Complaint
      - `customer_name` (text) - Customer name
      - `contact_number` (text) - Customer contact
      - `line_items` (jsonb) - Array of line items with product details
      - `sub_total` (numeric) - Subtotal before GST
      - `round_off` (numeric) - Rounding adjustment
      - `grand_total` (numeric) - Final total amount
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `quotations` table
    - Add policies for authenticated users to manage quotations
*/

CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_number text UNIQUE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  place_of_supply text NOT NULL DEFAULT '29-Karnataka',
  pipeline_source text NOT NULL DEFAULT 'Sales',
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  sub_total numeric(10,2) NOT NULL DEFAULT 0,
  round_off numeric(10,2) NOT NULL DEFAULT 0,
  grand_total numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view quotations"
  ON quotations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert quotations"
  ON quotations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update quotations"
  ON quotations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete quotations"
  ON quotations
  FOR DELETE
  TO authenticated
  USING (true);

-- Create sequence for estimate numbers
CREATE SEQUENCE IF NOT EXISTS quotation_estimate_number_seq START WITH 1;
