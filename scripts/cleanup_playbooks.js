import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
    console.log('Scanning for incomplete placeholder playbooks...');
    const { data: playbooks, error } = await supabase.from('playbooks').select('id, title');

    if (error) {
        console.error(error);
        return;
    }

    let deletedCount = 0;
    for (const pb of playbooks) {
        const { count } = await supabase.from('playbook_steps')
            .select('*', { count: 'exact', head: true })
            .eq('playbook_id', pb.id);

        if (count < 2) {
            console.log(`Deleting incomplete playbook: ${pb.title} (${count} steps)`);
            await supabase.from('playbooks').delete().eq('id', pb.id);
            deletedCount++;
        }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} placeholder playbooks.`);
}

cleanup();
