import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const enterprisePlaybooks = [
    {
        title: 'Automated RFP Response Engine',
        slug: 'automated-rfp-response-engine',
        category: 'Enterprise Sales',
        subtitle: 'Instantly generate precise, compliant bids for government/enterprise Requests for Proposals without writing a word from scratch.',
        difficulty: 'Intermediate',
        timeToComplete: 15,
        timeSaved: 600, // 10 hours
        isPro: true,
        isNew: true,
        isEnterprise: true,
        expectedOutcome: 'A highly formal, structured, and compliant draft for an RFP executive summary and technical response.',
        tools: ['ChatGPT Enterprise', 'Claude Team', 'PDF Reader'],
        rating: 4.9,
        completionCount: 1520,
        troubleshooting: ['If the AI hallucinates capabilities, ensure you explicitly tell it to flag missing requirements.', 'If the PDF is too large to upload, consider extracting just the matrix section first.'],
        steps: [
            {
                stepNumber: 1,
                title: 'Sanitize & Prepare Data',
                instruction: 'Ensure you are using an Enterprise AI tier (like ChatGPT Enterprise or Claude Team) which guarantees a zero-data-retention policy so your proprietary data is not used for training. Download your 100+ page RFP PDF.',
            },
            {
                stepNumber: 2,
                title: 'Matrix Extraction via AI',
                instruction: 'Open a new chat. Upload the RFP PDF directly into the chat window.',
                promptTemplate: 'Act as a Senior Bid Manager. Analyze the attached RFP document: [Link to RFP Document]. Extract every single mandatory requirement, compliance standard, and deliverable into a structured markdown table mapping the "Requirement ID" to the "Page Number" and "Description".',
                expectedOutput: 'A complete markdown table listing all requirements from the RFP.',
                tips: 'Always double-check the first and last requirements in the table against the original PDF to ensure complete extraction.'
            },
            {
                stepNumber: 3,
                title: 'Draft the Response',
                instruction: 'Now, upload your company\'s internal capabilities deck or past proposals to the same chat to give the AI your voice.',
                promptTemplate: 'Using the capabilities outlined in the newly attached document: [Link to Internal Capabilities Deck], draft the executive summary and the primary technical response section for this RFP. Ensure the tone is highly formal and addresses the specific compliance requirements. Do not hallucinate capabilities; if our document does not address a requirement, explicitly output [FLAG FOR HUMAN REVIEW].',
                expectedOutput: 'A drafted RFP response containing your company\'s true capabilities, with missing requirements clearly flagged.',
                tips: 'This is a first draft. You will still need a human expert to review the flagged sections and finalize pricing.'
            }
        ]
    },
    {
        title: 'Policy Impact Analysis Agent',
        slug: 'policy-impact-analysis-agent',
        category: 'Legal & Compliance',
        subtitle: 'Analyze new government policies or regulatory shifts and summarize their impact on your organization in minutes.',
        difficulty: 'Beginner',
        timeToComplete: 10,
        timeSaved: 180, // 3 hours
        isPro: true,
        isNew: true,
        isEnterprise: true,
        expectedOutcome: 'A 1-page executive memo summarizing a new legal policy and its precise operational risks to your department.',
        tools: ['Perplexity', 'ChatGPT Enterprise'],
        rating: 4.8,
        completionCount: 2105,
        troubleshooting: [],
        steps: [
            {
                stepNumber: 1,
                title: 'Initial Legal Research',
                instruction: 'Open Perplexity.ai (a search-connected AI). Search for the exact name of the new policy to get an authoritative summary.',
                promptTemplate: 'Find the official text and top 3 legal analyses from reputable law firms regarding the recent [Policy Name]. Provide a concise 5-bullet summary of the core mandates.',
                expectedOutput: 'A concise summary of the legal text with verified citations.',
            },
            {
                stepNumber: 2,
                title: 'Impact Synthesis',
                instruction: 'Copy the output from Perplexity and open your secure Enterprise ChatGPT.',
                promptTemplate: 'Act as a Chief Compliance Officer for the [Organization Department]. Review the following policy mandates: [Paste Perplexity Summary]. Create an Impact Analysis report detailing exactly how this policy will affect our [Key Operational Areas]. Highlight explicit risks and propose an immediate 3-step mitigation strategy.',
                expectedOutput: 'Detailed breakdown of organizational risks and a mitigation strategy.',
                tips: 'Ensure you list specific departments or processes in the "[Key Operational Areas]" variable.'
            },
            {
                stepNumber: 3,
                title: 'Draft Executive Memo',
                instruction: 'Turn the complex legal analysis into a highly readable, standardized memo for the board of directors.',
                promptTemplate: 'Convert the impact analysis into a 1-page executive memo for the board of directors. Use clear, non-jargon language emphasizing operational risk and the proposed solutions. Format it with a bold header and bulleted action items.',
                expectedOutput: 'A polished, ready-to-distribute memo for executives.'
            }
        ]
    },
    {
        title: 'Large-Scale PII Sanitization Workflow',
        slug: 'large-scale-pii-sanitization',
        category: 'Data Security',
        subtitle: 'Automatically redact Personally Identifiable Information (PII) from hundreds of documents securely using NO code.',
        difficulty: 'Intermediate',
        timeToComplete: 15,
        timeSaved: 900, // 15 hours
        isPro: true,
        isNew: true,
        isEnterprise: true,
        expectedOutcome: 'A zipped folder of your documents with all specified PII entirely removed and replaced with "[REDACTED]".',
        tools: ['ChatGPT Enterprise', 'Data Analysis'],
        rating: 5.0,
        completionCount: 843,
        troubleshooting: ['If the download link expires, just ask the AI to "Provide the link again".', 'Ensure your zip file contains standard text-based documents (.txt, .docx, or readable .pdfs).'],
        steps: [
            {
                stepNumber: 1,
                title: 'Zip Your Files',
                instruction: 'Gather all the text, Word, or PDF documents you need sanitized into a single folder on your computer. Right-click the folder and select "Compress" or "Zip" to create a single .zip file.',
            },
            {
                stepNumber: 2,
                title: 'Upload to Advanced Data Analysis',
                instruction: 'Open ChatGPT Enterprise (ensure you are using the GPT-4 model with Data Analysis capabilities enabled). Drag and drop your .zip file into the chat box.',
            },
            {
                stepNumber: 3,
                title: 'Run the Redaction Prompt',
                instruction: 'Instruct the AI\'s internal code interpreter to do the heavy lifting for you.',
                promptTemplate: 'I have attached a zip file containing sensitive documents. Using your internal Advanced Data Analysis Python environment, please write and execute a script that unzips the folder, opens every text-based file, and uses Regex to replace all instances of [Specific PII to Redact (e.g., standard Social Security Numbers and 10-digit Phone Numbers)] with the exact string "[REDACTED]". After processing all files, re-zip the sanitized files and provide me with a secure download link.',
                expectedOutput: 'A downloadable .zip file link provided in the chat interface.',
                tips: 'This utilizes the AI\'s backend sandboxed environment, ensuring no specialized software needs to be installed on your computer.'
            },
            {
                stepNumber: 4,
                title: 'Download and Verify',
                instruction: 'Click the download link provided by ChatGPT to retrieve your sanitized files. Spot-check 2-3 files to confirm redaction was successful.',
            }
        ]
    },
    {
        title: 'Grant Proposal Generation & Structuring',
        slug: 'grant-proposal-generation',
        category: 'Public Sector',
        subtitle: 'Turn rough project notes into a highly structured, compliant public sector grant application.',
        difficulty: 'Beginner',
        timeToComplete: 20,
        timeSaved: 480, // 8 hours
        isPro: true,
        isNew: true,
        isEnterprise: true,
        expectedOutcome: 'A structured "Statement of Need", "Project Narrative", and "Budget Justification".',
        tools: ['Claude', 'ChatGPT'],
        rating: 4.7,
        completionCount: 1102,
        troubleshooting: [],
        steps: [
            {
                stepNumber: 1,
                title: 'Upload the Rubric',
                instruction: 'Government grants live and die by the rubric. Download the official PDF guidelines or rubric provided by the state/federal agency and upload it to Claude or ChatGPT.',
            },
            {
                stepNumber: 2,
                title: 'Draft the Narrative',
                instruction: 'Feed your rough, bullet-point project goals into the system alongside the rubric.',
                promptTemplate: 'We are applying for a grant from [Grant Provider Name]. Our core rough project goals are: [Project Goals]. Based *strictly* on the scoring rubric in the attached PDF, write a compelling "Statement of Need" and "Project Narrative". Ensure the tone is persuasive, evidence-based, and academic. Use the exact headers required by the rubric.',
                expectedOutput: 'A drafted text document that perfectly mirrors the header structure of the target grant.',
                tips: 'Claude is exceptionally good at maintaining the strict formatting requirements common in federal grants.'
            },
            {
                stepNumber: 3,
                title: 'Format the Budget Justification',
                instruction: 'Ensure the proposed budget narrative perfectly aligns with the strict limits provided in the grant guidelines.',
                promptTemplate: 'Based on our newly generated project narrative and these constraints: [Budget Constraints], draft a realistic Budget Justification section explaining in deep detail why each dollar is necessary for the project\'s success and adheres to the granting agency\'s cost principles.',
                expectedOutput: 'A text-based narrative backing up your proposed spreadsheet numbers.'
            }
        ]
    },
    {
        title: 'Employee Training & SOP Interpreter Bot',
        slug: 'employee-training-sop-bot',
        category: 'Human Resources',
        subtitle: 'Turn a 500-page institutional manual into an interactive chat agent for new hires without IT help.',
        difficulty: 'Beginner',
        timeToComplete: 15,
        timeSaved: 1200, // 20 hours
        isPro: true,
        isNew: true,
        isEnterprise: true,
        expectedOutcome: 'A private chat link that new hires can use to instantly query your massive employee handbook.',
        tools: ['Custom GPTs', 'ChatGPT Enterprise'],
        rating: 4.9,
        completionCount: 3045,
        troubleshooting: ['If the bot gives generic advice, double-check that you specifically instructed it to only reference uploaded documents.'],
        steps: [
            {
                stepNumber: 1,
                title: 'Create the Custom GPT',
                instruction: 'In ChatGPT Enterprise, click "Explore GPTs" in the sidebar, then click "+ Create" in the top right.',
            },
            {
                stepNumber: 2,
                title: 'Upload Institutional Knowledge',
                instruction: 'In the GPT builder, go to the "Configure" tab. Scroll down to "Knowledge" and upload your massive [Link to SOP Manual] PDF.',
                tips: 'You can upload up to 20 highly detailed manuals in this section.'
            },
            {
                stepNumber: 3,
                title: 'Lock Down the Instructions',
                instruction: 'This is the most critical step to prevent the AI from making up policy. Paste the following into the "Instructions" box:',
                promptTemplate: 'You are the internal training assistant for the [Department Name]. Your ONLY job is to help employees navigate the uploaded Standard Operating Procedures document. If an employee asks how to handle a specific administrative task, quote the exact section from the manual and provide a 3-step summary. NEVER guess an answer or provide advice outside the manual. If the answer is not in the text, explicitly state "I cannot find this in the SOP, please contact HR."',
                expectedOutput: 'A tightly controlled AI agent constrained to your specific rules.',
            },
            {
                stepNumber: 4,
                title: 'Publish Internally',
                instruction: 'Click "Save" in the top right corner, and ensure you select "Only people in my workspace." Share the link with your new hires for instant onboarding support!',
            }
        ]
    }
];

async function seedEnterprisePlaybooks() {
    console.log('Seeding Enterprise playbooks...');

    try {
        for (const pb of enterprisePlaybooks) {
            console.log(`Processing ${pb.title}...`);

            const { data: playbook, error: pError } = await supabase
                .from('playbooks')
                .upsert({
                    title: pb.title,
                    slug: pb.slug,
                    category: pb.category,
                    subtitle: pb.subtitle,
                    difficulty: pb.difficulty,
                    time_to_complete: pb.timeToComplete,
                    time_saved: pb.timeSaved,
                    is_pro: pb.isPro,
                    is_new: pb.isNew,
                    expected_outcome: pb.expectedOutcome,
                    tools: pb.tools,
                    rating: pb.rating,
                    completion_count: pb.completionCount
                }, { onConflict: 'slug' })
                .select()
                .single();

            if (pError) throw pError;

            console.log(`✓ Inserted/Updated playbook: ${playbook.title}`);

            // Delete existing steps to avoid duplication on re-run
            const { error: deleteError } = await supabase
                .from('playbook_steps')
                .delete()
                .eq('playbook_id', playbook.id);

            if (deleteError) throw deleteError;

            // Insert new detailed steps
            const stepsToInsert = pb.steps.map(step => ({
                playbook_id: playbook.id,
                step_number: step.stepNumber,
                title: step.title,
                instruction: step.instruction,
                prompt_template: step.promptTemplate,
                expected_output: step.expectedOutput,
                tips: step.tips
            }));

            const { error: sError } = await supabase
                .from('playbook_steps')
                .insert(stepsToInsert);

            if (sError) throw sError;
            console.log(`  ✓ Inserted ${stepsToInsert.length} steps`);
        }

        console.log('✅ Enterprise seed completed successfully!');
    } catch (error) {
        console.error('Error during seeding:', error);
    }
}

seedEnterprisePlaybooks();
