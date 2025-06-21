-- =====================================================
-- AUTO-CREATE PUBLIC USER TRIGGER
-- =====================================================
-- This trigger automatically creates a record in public.users
-- whenever a new user is created in auth.users
-- Ensures data consistency between auth and application data
-- =====================================================

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user into public.users table
  INSERT INTO public.users (uuid_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'student'  -- Default role is student
  );
  
  -- Also create initial statistics record for the new user
  INSERT INTO public.user_statistics (user_uuid)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Handle existing auth users who might not be in public.users
-- (This is a one-time sync for existing users)
INSERT INTO public.users (uuid_id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  'student'
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.uuid_id
WHERE pu.uuid_id IS NULL  -- Only insert users that don't already exist
ON CONFLICT (uuid_id) DO NOTHING;

-- Step 4: Ensure all users have statistics records
INSERT INTO public.user_statistics (user_uuid)
SELECT pu.uuid_id
FROM public.users pu
LEFT JOIN public.user_statistics us ON pu.uuid_id = us.user_uuid
WHERE us.user_uuid IS NULL  -- Only create statistics for users who don't have them
ON CONFLICT (user_uuid) DO NOTHING;

-- Step 5: Create a function to handle user deletion (optional but recommended)
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up user data when auth user is deleted
  DELETE FROM public.user_activity WHERE user_uuid = OLD.id;
  DELETE FROM public.user_sessions WHERE user_uuid = OLD.id;
  DELETE FROM public.user_statistics WHERE user_uuid = OLD.id;
  DELETE FROM public.user_category_progress WHERE user_uuid = OLD.id;
  DELETE FROM public.user_word_progress WHERE user_uuid = OLD.id;
  DELETE FROM public.users WHERE uuid_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create the deletion trigger
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the trigger is working:
--
-- 1. Check that all auth users have corresponding public users:
-- SELECT 
--   COUNT(*) as auth_users,
--   (SELECT COUNT(*) FROM public.users) as public_users,
--   (SELECT COUNT(*) FROM public.user_statistics) as user_statistics
-- FROM auth.users;
--
-- 2. Test the trigger by creating a test user (don't run in production):
-- INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   gen_random_uuid(),
--   'authenticated',
--   'authenticated',
--   'test@example.com',
--   crypt('password123', gen_salt('bf')),
--   now(),
--   '{"full_name": "Test User"}',
--   now(),
--   now()
-- );
--
-- 3. Verify trigger functions exist:
-- SELECT proname, prosrc FROM pg_proc WHERE proname IN ('handle_new_user', 'handle_user_delete');
--
-- 4. Verify triggers exist:
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name IN ('on_auth_user_created', 'on_auth_user_deleted'); 