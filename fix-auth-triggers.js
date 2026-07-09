#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment from .env.local
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8').split('\n');
  env.forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const migrationSQL = `
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
    (SELECT id FROM roles WHERE name = 'user'),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
  );

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_handle_new_user
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
`;

async function applyMigration() {
  try {
    console.log('🔄 [MIGRATION] Applying auth trigger fixes...');
    
    const { error } = await supabase.rpc('exec', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ [MIGRATION] Error:', error);
      process.exit(1);
    }
    
    console.log('✅ [MIGRATION] Auth triggers fixed successfully!');
  } catch (error) {
    console.error('❌ [MIGRATION] Unexpected error:', error.message);
    process.exit(1);
  }
}

applyMigration();
