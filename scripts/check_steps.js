import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: playbooks, error } = await supabase.from('playbooks').select('id, title');
  if (error) {
    console.error(error);
    return;
  }
  
  for (const pb of playbooks) {
    const { count } = await supabase.from('playbook_steps').select('*', { count: 'exact', head: true }).eq('playbook_id', pb.id);
    console.log(`- ${pb.title}: ${count} steps`);
  }
}
check();
