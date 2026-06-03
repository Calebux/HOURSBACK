import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    const targetEmail = 'petersoncalebc@gmail.com';

    // 1. Get the user's ID
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', targetEmail)
        .single();

    if (profileError || !profileData) {
        console.error("Could not find profile for email", targetEmail, profileError);
        return;
    }

    const userId = profileData.id;
    console.log("Found profile for user:", userId);

    // 2. Attempt to update the user with the anon key
    const { data, error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'pro' })
        .eq('id', userId)
        .select();

    console.log("Update Result using Anon Key:", { data, error });
}

testUpdate();
