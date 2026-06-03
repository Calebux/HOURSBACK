import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function makeAdmin() {
    const { data: users, error: fetchErr } = await supabase.from('profiles').select('id, email').limit(1);
    console.log('Fetch Result:', { users, fetchErr });

    if (fetchErr || !users || users.length === 0) {
        console.error('Failed to fetch user. There are either no user profiles in the DB or there is an RLS issue:', fetchErr);
        return;
    }
    const userId = users[0].id;
    console.log(`Setting is_admin=true for user: ${users[0].email} (${userId})`);

    const { error: updateErr } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', userId);

    if (updateErr) {
        console.error('Failed to update user:', updateErr);
    } else {
        console.log('Successfully made user an admin.');
    }
}

makeAdmin();
