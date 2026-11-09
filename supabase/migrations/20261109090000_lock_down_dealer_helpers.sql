/*
  # Lock down dealer helpers

  - is_dealer(): only signed-in users may call it (not anonymous API callers).
  - user_profiles: signed-in users may only read (row-level security still limits
    them to their own row); anonymous callers get no access. Roles are still
    assigned by an admin in the SQL editor.
*/

REVOKE EXECUTE ON FUNCTION is_dealer() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_dealer() TO authenticated;

REVOKE ALL ON TABLE user_profiles FROM anon, authenticated;
GRANT SELECT ON TABLE user_profiles TO authenticated;
