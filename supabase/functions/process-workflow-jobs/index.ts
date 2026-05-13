import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceRoleClient, executeWorkflowRun } from "../_shared/workflow_runner.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const JOB_BATCH_SIZE = 12;
const JOB_CONCURRENCY = 3;

async function runWithConcurrency<T>(items: T[], concurrency: number, handler: (item: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      await handler(item);
    }
  });
  await Promise.allSettled(workers);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createServiceRoleClient();
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const batchSize = Number.isFinite(Number(body.batch_size)) ? Math.max(1, Math.min(Number(body.batch_size), 50)) : JOB_BATCH_SIZE;
    const concurrency = Number.isFinite(Number(body.concurrency)) ? Math.max(1, Math.min(Number(body.concurrency), 10)) : JOB_CONCURRENCY;

    const { data: claimedJobs, error: claimError } = await supabase.rpc("claim_workflow_jobs", { p_limit: batchSize });
    if (claimError) throw new Error(`Failed to claim workflow jobs: ${claimError.message}`);

    const jobs = claimedJobs || [];
    if (jobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: "No queued workflow jobs." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const workflowIds = [...new Set(jobs.map((job: any) => job.workflow_id))];
    const { data: workflows, error: workflowError } = await supabase.from("workflows").select("*").in("id", workflowIds);
    if (workflowError) throw new Error(`Failed to load queued workflows: ${workflowError.message}`);

    const workflowMap = new Map((workflows || []).map((workflow: any) => [workflow.id, workflow]));
    let processed = 0;

    await runWithConcurrency(jobs, concurrency, async (job: any) => {
      const workflow = workflowMap.get(job.workflow_id);
      if (!workflow) {
        await supabase.from("workflow_jobs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            error_message: "Workflow not found for queued job.",
          })
          .eq("id", job.id);
        return;
      }

      const result = await executeWorkflowRun(supabase, workflow, { manualRun: false });
      await supabase.from("workflow_jobs")
        .update({
          status: result.status,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error_message: result.errorMessage,
          run_output: result.generatedOutput,
        })
        .eq("id", job.id);
      processed += 1;
    });

    return new Response(
      JSON.stringify({ success: true, claimed: jobs.length, processed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err: any) {
    console.error("[WorkflowWorker] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
