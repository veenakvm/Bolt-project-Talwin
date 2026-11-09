/*
  # Vendor self sign-up with staff approval

  Roles in user_profiles:
    - staff     full access
    - dealer    vendor/dealer: only their own quotations and invoices
    - pending   signed up, waiting for staff approval: no access
    - disabled  access removed

  1. Every existing login is marked as staff (dealer rows already set are kept).
  2. Every NEW login (self sign-up, or created in the dashboard) starts as 'pending'.
  3. Staff can see all profiles and change roles with set_user_role().
  4. Quotations, invoices and the product catalog are only available to staff
     and approved vendors.
*/

-- 1. Profile columns and roles ---------------------------------------------

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('staff', 'dealer', 'pending', 'disabled'));

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email text DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company text DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone text DEFAULT '';

-- Existing logins become staff; keep any role already assigned.
INSERT INTO user_profiles (user_id, role, email)
SELECT id, 'staff', COALESCE(email, '') FROM auth.users
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

-- 2. New logins start as pending -------------------------------------------

CREATE OR REPLACE FUNCTION talwin_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, role, email, display_name, company, phone)
  VALUES (
    NEW.id,
    'pending',
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS talwin_on_auth_user_created ON auth.users;
CREATE TRIGGER talwin_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION talwin_handle_new_user();

-- 3. Helpers ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'staff'
  );
$$;

REVOKE EXECUTE ON FUNCTION is_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_staff() TO authenticated;

CREATE OR REPLACE FUNCTION set_user_role(target_user uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_staff() THEN
    RAISE EXCEPTION 'Only staff can change user access';
  END IF;
  IF new_role NOT IN ('staff', 'dealer', 'pending', 'disabled') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  IF target_user = auth.uid() THEN
    RAISE EXCEPTION 'You cannot change your own access';
  END IF;
  UPDATE user_profiles SET role = new_role WHERE user_id = target_user;
END;
$$;

REVOKE EXECUTE ON FUNCTION set_user_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_user_role(uuid, text) TO authenticated;

-- Staff can see everyone's profile (users still see their own).
DROP POLICY IF EXISTS "Staff can read all profiles" ON user_profiles;
CREATE POLICY "Staff can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_staff());

-- 4. Access rules -----------------------------------------------------------

-- Product catalog: staff and approved vendors only.
DROP POLICY IF EXISTS "Authenticated users can read all products" ON products;
CREATE POLICY "Authenticated users can read all products"
  ON products FOR SELECT
  TO authenticated
  USING (is_staff() OR is_dealer());

-- Quotations: staff see all; approved vendors only their own; pending see nothing.
DROP POLICY IF EXISTS "Staff all, dealers own: view quotations" ON quotations;
DROP POLICY IF EXISTS "Staff all, dealers own: insert quotations" ON quotations;
DROP POLICY IF EXISTS "Staff all, dealers own: update quotations" ON quotations;
DROP POLICY IF EXISTS "Staff all, dealers own: delete quotations" ON quotations;

CREATE POLICY "Staff all, dealers own: view quotations"
  ON quotations FOR SELECT
  TO authenticated
  USING (is_staff() OR (is_dealer() AND user_id = auth.uid()));

CREATE POLICY "Staff all, dealers own: insert quotations"
  ON quotations FOR INSERT
  TO authenticated
  WITH CHECK (is_staff() OR (is_dealer() AND user_id = auth.uid()));

CREATE POLICY "Staff all, dealers own: update quotations"
  ON quotations FOR UPDATE
  TO authenticated
  USING (is_staff() OR (is_dealer() AND user_id = auth.uid()))
  WITH CHECK (is_staff() OR (is_dealer() AND user_id = auth.uid()));

CREATE POLICY "Staff all, dealers own: delete quotations"
  ON quotations FOR DELETE
  TO authenticated
  USING (is_staff() OR (is_dealer() AND user_id = auth.uid()));

-- Invoices keep their "own rows only" rules; additionally block pending/disabled users.
DROP POLICY IF EXISTS "Only staff and approved vendors use invoices" ON invoices;
CREATE POLICY "Only staff and approved vendors use invoices"
  ON invoices AS RESTRICTIVE FOR ALL
  TO authenticated
  USING (is_staff() OR is_dealer())
  WITH CHECK (is_staff() OR is_dealer());
