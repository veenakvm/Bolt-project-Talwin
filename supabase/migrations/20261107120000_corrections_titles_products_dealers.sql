/*
  # Corrections: customer titles, product links, quotation conversion, dealer role

  1. New columns
    - invoices.customer_title / quotations.customer_title (Mr. / Mrs. / Ms. / M/s. / Dr.)
    - quotations.converted_invoice_id: the invoice a quotation was converted into
    - complaint_pipeline.product_id / product_name / product_specs: the product the complaint is about
    - site_surveys.products_required: products chosen from the catalog, with specs

  2. Dealer role
    - New table user_profiles (user_id, role). A user with no row is treated as staff,
      so all existing logins keep working exactly as before.
    - Users can only READ their own profile row. Roles are assigned by an admin in the
      Supabase dashboard / SQL editor, e.g.:
        insert into user_profiles (user_id, role, display_name)
        values ('<auth user id>', 'dealer', 'Dealer name');
    - is_dealer(): helper used by the access rules below.

  3. Access rules
    - products: every logged-in user can read the catalog (dealers need it to build
      quotations). Only the owner can still add / edit / delete.
    - quotations: staff see all quotations (as before); dealers see only their own.
*/

-- 1. New columns ------------------------------------------------------------

ALTER TABLE invoices   ADD COLUMN IF NOT EXISTS customer_title text DEFAULT '';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS customer_title text DEFAULT '';

ALTER TABLE quotations ADD COLUMN IF NOT EXISTS converted_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL;

ALTER TABLE complaint_pipeline ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE complaint_pipeline ADD COLUMN IF NOT EXISTS product_name text DEFAULT '';
ALTER TABLE complaint_pipeline ADD COLUMN IF NOT EXISTS product_specs text DEFAULT '';

ALTER TABLE site_surveys ADD COLUMN IF NOT EXISTS products_required jsonb DEFAULT '[]'::jsonb;

-- 2. Dealer role ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'staff' CHECK (role IN ('staff', 'dealer')),
  display_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION is_dealer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'dealer'
  );
$$;

-- 3. Access rules -----------------------------------------------------------

-- Products: whole catalog readable by any logged-in user.
DROP POLICY IF EXISTS "Authenticated users can read all products" ON products;
CREATE POLICY "Authenticated users can read all products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE quotations ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid();

-- Quotations: replace the open "anyone logged in" rules with staff = all, dealer = own.
DROP POLICY IF EXISTS "Authenticated users can view quotations" ON quotations;
DROP POLICY IF EXISTS "Authenticated users can insert quotations" ON quotations;
DROP POLICY IF EXISTS "Authenticated users can update quotations" ON quotations;
DROP POLICY IF EXISTS "Authenticated users can delete quotations" ON quotations;
DROP POLICY IF EXISTS "Users can read own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can insert own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can update own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can delete own quotations" ON quotations;

CREATE POLICY "Staff all, dealers own: view quotations"
  ON quotations FOR SELECT
  TO authenticated
  USING (NOT is_dealer() OR user_id = auth.uid());

CREATE POLICY "Staff all, dealers own: insert quotations"
  ON quotations FOR INSERT
  TO authenticated
  WITH CHECK (NOT is_dealer() OR user_id = auth.uid());

CREATE POLICY "Staff all, dealers own: update quotations"
  ON quotations FOR UPDATE
  TO authenticated
  USING (NOT is_dealer() OR user_id = auth.uid())
  WITH CHECK (NOT is_dealer() OR user_id = auth.uid());

CREATE POLICY "Staff all, dealers own: delete quotations"
  ON quotations FOR DELETE
  TO authenticated
  USING (NOT is_dealer() OR user_id = auth.uid());

-- Invoices already restrict every user to their own rows, which is what dealers need.
