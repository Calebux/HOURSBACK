import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: proPlaybooks } = await supabase.from('playbooks').select('id, title, is_pro').eq('is_pro', true);
  console.log("Pro Playbooks:", proPlaybooks);
  
  if (proPlaybooks && proPlaybooks.length > 0) {
    const { data: steps } = await supabase.from('playbook_steps').select('id, playbook_id').eq('playbook_id', proPlaybooks[0].id);
    console.log(`Steps for ${proPlaybooks[0].title}:`, steps?.length);
  }
}
check();
