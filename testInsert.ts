import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const { data, error } = await supabase.from('profiles').insert([
        { id: '11111111-1111-1111-1111-111111111111', email: 'test@test.com' }
    ]);
    console.log("Insert Result:", { data, error });
}
testInsert();
