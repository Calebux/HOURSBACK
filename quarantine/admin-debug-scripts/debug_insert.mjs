import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

// We need a Service Role key to inspect or bypass RLS, but let's test a direct insert as anon
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    console.log("Testing auth login...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'idahoconnect212@gmail.com',
        password: 'owofasan'
    });
    console.log('Auth data:', authData.session ? 'success' : 'failed', authError?.message);

    if (authData.user) {
        const { data: profData, error: profError } = await supabase.from('profiles').select('*').eq('id', authData.user.id);
        console.log('Profile fetch:', profData, profError);

        if (!profData || profData.length === 0) {
            console.log('Trying to insert profile manually...');
            const { error: insErr } = await supabase.from('profiles').insert([{
                id: authData.user.id,
                email: 'idahoconnect212@gmail.com',
                is_admin: true
            }]);
            console.log('Insert error:', insErr);
        }
    }
}
run();
