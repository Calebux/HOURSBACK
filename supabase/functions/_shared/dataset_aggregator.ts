import Anthropic from "npm:@anthropic-ai/sdk";
import Papa from "npm:papaparse";

export interface AggregationRule {
  name: string;
  operation: "sum" | "average" | "min" | "max" | "count";
  column: string;
  conditions?: Array<{
    column: string;
    operator: "equals" | "contains" | "greater_than" | "less_than" | "not_equals";
    value: string | number;
  }>;
}

export interface AggregationPlan {
  calculations: AggregationRule[];
}

function evaluateCondition(rowValue: any, op: string, targetValue: any): boolean {
  if (rowValue === undefined || rowValue === null) return false;
  const strVal = String(rowValue).toLowerCase().trim();
  const targetStr = String(targetValue).toLowerCase().trim();
  const numVal = parseFloat(String(rowValue).replace(/[^0-9.-]+/g, ''));
  const targetNum = Number(targetValue);

  switch (op) {
    case "equals": return strVal === targetStr;
    case "not_equals": return strVal !== targetStr;
    case "contains": return strVal.includes(targetStr);
    case "greater_than": return !isNaN(numVal) && !isNaN(targetNum) && numVal > targetNum;
    case "less_than": return !isNaN(numVal) && !isNaN(targetNum) && numVal < targetNum;
    default: return false;
  }
}

function cleanNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

export async function aggregateCsvData(
  csvContent: string,
  workflowPrompt: string,
  anthropicApiKey: string
): Promise<{ aggregatedSummary: string; safeSample: string }> {
  try {
    // 1. Parse CSV into objects
    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
    const rows = parsed.data as Record<string, any>[];
    
    if (rows.length === 0) {
      return { aggregatedSummary: "No rows found in dataset.", safeSample: csvContent.substring(0, 1000) };
    }

    // Prepare a safe sample to send to Claude
    const headers = parsed.meta.fields || [];
    const sampleRows = rows.slice(0, 15);
    const safeSample = Papa.unparse(sampleRows);

    if (rows.length <= 15) {
      // If dataset is very small anyway, no need for complex aggregation loop
      return { aggregatedSummary: "Dataset is small, exact data provided below.", safeSample: csvContent.substring(0, 4000) };
    }

    // 2. Query Claude Haiku to determine the necessary calculations
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });
    const systemPrompt = `You are a data aggregation planner.
A user has uploaded a dataset and requested an analysis. The full dataset is too large to pass to the final report-generating AI. 
Before we run the final AI, we need to pre-aggregate the mathematical metrics securely using an exact code engine.

Your task: output a JSON object describing exactly what metrics to calculate from the rows.
The JSON must follow this exact schema:
{
  "calculations": [
    {
      "name": "metric name (e.g., Total Revenue)",
      "operation": "sum" | "average" | "min" | "max" | "count",
      "column": "exact_column_header_to_calculate",
      "conditions": [
        { "column": "header_to_check", "operator": "equals" | "contains" | "greater_than" | "less_than" | "not_equals", "value": "value to match" }
      ]
    }
  ]
}

- Omit conditions array if no filters apply.
- Use ONLY the exact column headers provided in the sample.
- Match the required metrics from the Goal prompt below.
- Return ONLY valid JSON, no markdown blocks or surrounding text.`;

    const userPrompt = `GOAL / REQUIRED METRICS:
${workflowPrompt}

CSV HEADERS:
${headers.join(", ")}

SAMPLE ROW DATA (First 15 rows):
${safeSample}`;

    const haikuRes = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });

    const rawContent = (haikuRes.content[0] as any).text as string;
    let plan: AggregationPlan | null = null;
    
    try {
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) {
        plan = JSON.parse(match[0]) as AggregationPlan;
      } else {
        plan = JSON.parse(rawContent) as AggregationPlan;
      }
    } catch (e) {
      console.error("[Autopilot] Failed to parse aggregation plan JSON", rawContent);
      return { aggregatedSummary: "Failed to parse aggregation plan.", safeSample: csvContent.substring(0, 4000) };
    }

    if (!plan || !plan.calculations || !Array.isArray(plan.calculations)) {
      return { aggregatedSummary: "", safeSample: csvContent.substring(0, 4000) };
    }

    // 3. Execute the aggregations mathematically over all rows
    const results: Record<string, number> = {};
    const executionLogs: string[] = [];

    for (const calc of plan.calculations) {
      try {
        let count = 0;
        let sum = 0;
        let min = Infinity;
        let max = -Infinity;

        for (const row of rows) {
          // Check conditions
          let matches = true;
          if (calc.conditions && calc.conditions.length > 0) {
            for (const cond of calc.conditions) {
              if (!evaluateCondition(row[cond.column], cond.operator, cond.value)) {
                matches = false;
                break;
              }
            }
          }
          if (!matches) continue;

          count++;
          const val = cleanNumber(row[calc.column]);
          sum += val;
          if (val < min) min = val;
          if (val > max) max = val;
        }

        let resultVal = 0;
        if (count > 0) {
          switch (calc.operation) {
            case "sum": resultVal = sum; break;
            case "average": resultVal = sum / count; break;
            case "min": resultVal = min; break;
            case "max": resultVal = max; break;
            case "count": resultVal = count; break;
          }
        }
        
        results[calc.name] = resultVal;
        
        // Format nicely
        const isMoneyOrLarge = resultVal > 100 || (calc.column.toLowerCase().includes('amount') || calc.column.toLowerCase().includes('price'));
        const formattedVal = isMoneyOrLarge 
          ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(resultVal)
          : resultVal;
          
        executionLogs.push(`- **${calc.name}**: ${formattedVal} (Matches: ${count} rows)`);
      } catch (err) {
         console.warn(`[Autopilot] Aggregation error for ${calc.name}:`, err);
      }
    }

    const summary = executionLogs.length > 0 
      ? `## Exact Pre-Calculated Metrics (DO NOT HALLUCINATE SUMS)\nThe following totals were calculated securely from the full ${rows.length}-row dataset. Use these exact numbers in your final report:\n\n${executionLogs.join("\n")}`
      : "No mathematical aggregations were successfully compiled from the dataset.";

    return {
      aggregatedSummary: summary,
      safeSample: safeSample
    };
  } catch (error: any) {
    console.error("[Autopilot] Global aggregation error", error);
    return { aggregatedSummary: `Aggregation failed: ${error.message}`, safeSample: csvContent.substring(0, 4000) };
  }
}
