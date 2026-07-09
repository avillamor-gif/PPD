-- Fix duplicate handle_new_user function
-- The schema.sql version was missing SECURITY DEFINER which caused RLS issues
-- This fix allows user creation to complete successfully

DROP TRIGGER IF EXISTS trigger_handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate with proper SECURITY DEFINER and all fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    display_name,
    full_name,
    role_id,
    email_verified
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name'),
    (SELECT id FROM roles WHERE name = 'user'), -- Default to 'user' role
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
  );

  -- Also create preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER trigger_handle_new_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure handle_email_verified also has SECURITY DEFINER
DROP TRIGGER IF EXISTS trigger_handle_email_verified ON auth.users;
DROP FUNCTION IF EXISTS handle_email_verified();

CREATE OR REPLACE FUNCTION public.handle_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.user_profiles
    SET email_verified = TRUE
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_handle_email_verified
AFTER UPDATE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_email_verified();
