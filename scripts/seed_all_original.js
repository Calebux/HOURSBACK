import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env') });
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    console.log('Extracting playbooks...');
    // Since TSC is failing on types, let's just write a tiny extraction script that tsx can run
    const extractorSrc = `
    import { mockPlaybooks } from '../src/data/playbooks.ts';
    import { writeFileSync } from 'fs';
    writeFileSync('./scripts/extracted.json', JSON.stringify(mockPlaybooks));
  `;
    writeFileSync('./scripts/extract.ts', extractorSrc);

    execSync('npx tsx ./scripts/extract.ts');

    const mockPlaybooks = JSON.parse(readFileSync('./scripts/extracted.json', 'utf-8'));
    console.log(`Found ${mockPlaybooks.length} playbooks to migrate.`);

    for (const pb of mockPlaybooks) {
        console.log(`Migrating: ${pb.title}`);

        const playbookData = {
            slug: pb.slug,
            title: pb.title,
            subtitle: pb.subtitle,
            category: pb.category,
            difficulty: pb.difficulty,
            time_to_complete: pb.timeToComplete,
            time_saved: pb.timeSaved,
            completion_count: pb.completionCount,
            rating: pb.rating,
            is_pro: pb.isPro,
            is_new: pb.isNew || false,
            tools: pb.tools || [],
            before_you_start: pb.beforeYouStart || [],
            expected_outcome: pb.expectedOutcome || ''
        };

        const { data: insertedPb, error: pbError } = await supabase
            .from('playbooks')
            .upsert(playbookData, { onConflict: 'slug' })
            .select()
            .single();

        if (pbError) {
            console.error(`  ❌ Error inserting playbook:`, pbError.message);
            continue;
        }

        if (pb.steps && pb.steps.length > 0) {
            for (const step of pb.steps) {
                const stepData = {
                    playbook_id: insertedPb.id,
                    step_number: step.stepNumber,
                    title: step.title,
                    instruction: step.instruction,
                    prompt_template: step.promptTemplate || '',
                    expected_output: step.expectedOutput || '',
                    tips: step.tips || '',
                    tools: step.tools || []
                };

                // Since playbooks already existed, the steps might exist too, upsert based on playbook_id+step_number requires a constraint
                // Let's just delete existing steps for this playbook and re-insert to avoid constraint issues during this migration
                await supabase.from('playbook_steps').delete().eq('playbook_id', insertedPb.id).eq('step_number', step.stepNumber);

                const { error: stepError } = await supabase.from('playbook_steps').insert(stepData);
                if (stepError) {
                    console.error(`  ❌ Error inserting step ${step.stepNumber}:`, stepError.message);
                }
            }
            console.log(`  ✅ Migrated ${pb.steps.length} steps.`);
        }
    }

    // Cleanup transpiled file
    try {
        unlinkSync(resolve(process.cwd(), 'scripts/playbooks.js'));
    } catch (e) { }

    console.log('🎉 Full library migration complete!');
    process.exit(0);
}

seed();
