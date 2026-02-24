import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('playbooks').select('title');
  if (error) console.error(error);
  else {
    console.log(`Total playbooks: ${data.length}`);
    data.forEach(p => console.log(`- ${p.title}`));
  }
}
check();
