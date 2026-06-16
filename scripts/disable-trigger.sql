-- Disable the trigger that's blocking user creation
DROP TRIGGER IF EXISTS trigger_handle_new_user ON auth.users;

-- Now try creating the user again in Supabase UI
-- Then re-enable with:
-- CREATE TRIGGER trigger_handle_new_user
-- AFTER INSERT ON auth.users
-- FOR EACH ROW
-- EXECUTE FUNCTION handle_new_user();
