import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  const testEmail = `test_${Date.now()}@example.com`;
  console.log('Testing signup with:', testEmail);
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'Password123!',
  });
  
  if (error) {
    console.error('Signup Error:', error.message);
  } else {
    console.log('Signup Data:', JSON.stringify(data, null, 2));
    if (data.session) {
      console.log('🔴 BAD: Session was returned. User is automatically logged in.');
    } else {
      console.log('🟢 GOOD: Session is null. User must confirm email.');
    }
  }
}

testSignup();
