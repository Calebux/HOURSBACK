import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data: profData, error: profError } = await supabase.from('profiles').select('*').eq('email', 'idahoconnect212@gmail.com');
    console.log('Profile DB query result:', profData, profError);
}
run();
