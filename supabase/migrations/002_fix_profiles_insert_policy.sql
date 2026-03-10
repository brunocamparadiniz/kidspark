-- Fix: profiles table was missing an INSERT policy.
-- The handle_new_user() trigger uses SECURITY DEFINER so it can insert,
-- but this policy is needed as a safety net and for any client-side profile creation.
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
