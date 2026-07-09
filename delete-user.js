const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function deleteUser(email) {
  try {
    // List all users to find the one to delete
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return;
    }
    
    const user = users.users.find(u => u.email === email);
    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }
    
    console.log(`Found user: ${user.id} - ${user.email}`);
    
    // Delete the user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return;
    }
    
    console.log(`✅ User ${email} deleted successfully`);
  } catch (error) {
    console.error('Error:', error);
  }
}

const email = process.argv[2] || 'avillamor0409@gmail.com';
deleteUser(email);
