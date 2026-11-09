/*
  # Close the sign-up trigger function to direct API calls

  talwin_handle_new_user() only needs to run as the trigger on auth.users;
  nobody needs to call it directly.
*/

REVOKE EXECUTE ON FUNCTION talwin_handle_new_user() FROM PUBLIC, anon, authenticated;
