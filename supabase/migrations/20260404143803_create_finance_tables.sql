/*
  # Create Finance Management Tables

  ## New Tables
  
  ### 1. architects
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `name` (text) - Architect name
    - `phone_number` (text) - Contact phone
    - `company_name` (text) - Company/Firm name
    - `city` (text) - City location
    - `locality` (text) - Locality/Area
    - `email` (text, optional) - Email address
    - `notes` (text, optional) - Additional notes
    - `created_at` (timestamptz)

  ### 2. vendors
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `name` (text) - Vendor name
    - `phone_number` (text) - Contact phone
    - `category` (text) - Vendor category
    - `company_name` (text) - Company name
    - `city` (text) - City location
    - `locality` (text) - Locality/Area
    - `email` (text, optional) - Email address
    - `notes` (text, optional) - Additional notes
    - `created_at` (timestamptz)

  ### 3. expenses
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `date` (date) - Expense date
    - `category` (text) - Purchase/Transport/Labour/Office/Misc
    - `description` (text) - Expense description
    - `amount` (numeric) - Expense amount
    - `payment_mode` (text) - Cash/UPI/Bank Transfer
    - `remarks` (text, optional) - Additional remarks
    - `created_at` (timestamptz)

  ### 4. invoices
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `invoice_number` (text, unique) - Auto-incremented invoice number
    - `date` (date) - Invoice date
    - `place_of_supply` (text) - Place of supply
    - `customer_name` (text) - Customer name
    - `contact_number` (text) - Customer contact
    - `pipeline_source` (text) - Sales/Installation/Service
    - `line_items` (jsonb) - Array of line items
    - `sub_total` (numeric) - Sub total amount
    - `round_off` (numeric) - Round off amount
    - `grand_total` (numeric) - Grand total
    - `created_at` (timestamptz)

  ### 5. quotations
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key to auth.users)
    - `estimate_number` (text, unique) - Auto-incremented estimate number
    - `date` (date) - Quotation date
    - `place_of_supply` (text) - Place of supply
    - `customer_name` (text) - Customer name
    - `contact_number` (text) - Customer contact
    - `pipeline_source` (text) - Sales/Installation/Service
    - `line_items` (jsonb) - Array of line items
    - `sub_total` (numeric) - Sub total amount
    - `round_off` (numeric) - Round off amount
    - `grand_total` (numeric) - Grand total
    - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their own data
*/

-- Architects Table
CREATE TABLE IF NOT EXISTS architects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone_number text NOT NULL,
  company_name text DEFAULT '',
  city text DEFAULT '',
  locality text DEFAULT '',
  email text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE architects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own architects"
  ON architects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own architects"
  ON architects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own architects"
  ON architects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own architects"
  ON architects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  phone_number text NOT NULL,
  category text DEFAULT '',
  company_name text DEFAULT '',
  city text DEFAULT '',
  locality text DEFAULT '',
  email text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendors"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vendors"
  ON vendors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vendors"
  ON vendors FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_mode text NOT NULL,
  remarks text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number text UNIQUE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  place_of_supply text DEFAULT '29-Karnataka',
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  pipeline_source text NOT NULL,
  line_items jsonb DEFAULT '[]'::jsonb,
  sub_total numeric DEFAULT 0,
  round_off numeric DEFAULT 0,
  grand_total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  estimate_number text UNIQUE NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  place_of_supply text DEFAULT '29-Karnataka',
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  pipeline_source text NOT NULL,
  line_items jsonb DEFAULT '[]'::jsonb,
  sub_total numeric DEFAULT 0,
  round_off numeric DEFAULT 0,
  grand_total numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quotations"
  ON quotations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotations"
  ON quotations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotations"
  ON quotations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotations"
  ON quotations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);