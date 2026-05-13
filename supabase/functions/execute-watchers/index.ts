import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceRoleClient, executeWorkflowRun } from "../_shared/workflow_runner.ts";
import { getClientIp, checkRateLimit, rateLimitResponse } from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENQUEUE_LIMIT = 250;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createServiceRoleClient();
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const manualWorkflowId: string | undefined = body.workflow_id;

    if (manualWorkflowId) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized." }), { status: 401, headers: corsHeaders });
      }

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Invalid token." }), { status: 401, headers: corsHeaders });
      }

      const clientIp = getClientIp(req);
      const rl = await checkRateLimit(supabase, `manual-run:${clientIp}`, 20, 3600);
      if (!rl.allowed) return rateLimitResponse();

      const { data: workflow, error } = await supabase.from("workflows").select("*").eq("id", manualWorkflowId).single();
      if (error || !workflow) {
        return new Response(JSON.stringify({ error: "Workflow not found." }), { status: 404, headers: corsHeaders });
      }
      if (workflow.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden." }), { status: 403, headers: corsHeaders });
      }

      const result = await executeWorkflowRun(supabase, workflow, { manualRun: true });
      return new Response(
        JSON.stringify({ success: true, workflow_id: workflow.id, status: result.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const enqueueLimit = Number.isFinite(Number(body.limit)) ? Math.max(1, Math.min(Number(body.limit), 1000)) : ENQUEUE_LIMIT;
    const { data, error } = await supabase.rpc("enqueue_due_workflows", { p_limit: enqueueLimit });
    if (error) throw new Error(`Failed to enqueue workflows: ${error.message}`);

    return new Response(
      JSON.stringify({ success: true, queued: Number(data) || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err: any) {
    console.error("[WorkflowQueue] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
