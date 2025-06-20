-- Auto-confirm email addresses on user registration
-- This trigger automatically sets email_confirmed_at when a new user is created
-- ensuring they don't need to go through email confirmation

-- Create a function to auto-confirm emails
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Set email_confirmed_at to current timestamp for new users
  NEW.email_confirmed_at = NOW();
  
  -- Also ensure email_change_confirm_status is set to confirmed
  NEW.email_change_confirm_status = 0; -- 0 means confirmed
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table to auto-confirm emails
DROP TRIGGER IF EXISTS trigger_auto_confirm_email ON auth.users;
CREATE TRIGGER trigger_auto_confirm_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_email();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.auto_confirm_email() TO anon, authenticated; 