import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
// Use the service key to bypass all RLS for this administrative override
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY || ''; 

if (!supabaseServiceKey) {
  console.log("No service key available in env.");
  process.exit(0);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fix() {
  const targetEmail = 'petersoncalebc@gmail.com';
  
  // 1. Get user ID from Auth (Admin API)
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
      console.error("Auth list error:", listError);
      return;
  }
  
  const user = users.find(u => u.email === targetEmail);
  if (!user) {
      console.log("User not found in Auth system either. Waiting for user to actually log in.");
      return;
  }
  
  console.log("Found User ID:", user.id);
  
  // 2. Upsert profile forcefully
  const { data, error } = await supabaseAdmin.from('profiles').upsert(
      { 
          id: user.id, 
          email: user.email, 
          subscription_status: 'pro',
          is_admin: true 
      },
      { onConflict: 'id' }
  );
  
  console.log("Upsert result:", { data, error });
}

fix();
