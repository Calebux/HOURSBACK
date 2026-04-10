type Part = { type: 'text'; content: string } | { type: 'chart'; content: string };

function tryParseJson(raw: string): any | null {
  // First try as-is
  try { return JSON.parse(raw); } catch {}
  // Try auto-closing truncated JSON by appending common endings
  const closings = [']}', '}}', '}]}', '"}]}', '"}}}'];
  for (const c of closings) {
    try { return JSON.parse(raw + c); } catch {}
  }
  return null;
}

export function buildQuickChartUrl(spec: string): string | null {
  const config = tryParseJson(spec);
  try {
    if (!config || !config.data?.length) return null;

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

    const chartJs: any = {
      type: config.type === 'line' ? 'line' : config.type === 'pie' ? 'pie' : 'bar',
      data: {
        labels: config.data.map((d: any) => d.name),
        datasets: [{
          label: config.title || 'Value',
          data: config.data.map((d: any) => d.value),
          backgroundColor: config.type === 'pie'
            ? colors.slice(0, config.data.length)
            : config.color || '#3B82F6',
          borderColor: config.type === 'line' ? (config.color || '#3B82F6') : undefined,
          borderWidth: config.type === 'line' ? 2 : undefined,
          fill: false,
          tension: 0.3,
          borderRadius: config.type === 'bar' ? 6 : undefined,
        }],
      },
      options: {
        plugins: {
          title: { display: !!config.title, text: config.title, font: { size: 14, weight: 'bold' } },
          legend: { display: config.type === 'pie' },
        },
        scales: config.type !== 'pie' ? {
          y: { ticks: { callback: 'function(v){return typeof v==="number"&&v>=1000?v.toLocaleString():v}' }, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } },
        } : undefined,
      },
    };

    const encoded = encodeURIComponent(JSON.stringify(chartJs));
    return `https://quickchart.io/chart?c=${encoded}&width=700&height=320&backgroundColor=white&devicePixelRatio=2`;
  } catch {
    return null;
  }
}

export function parseReport(output: string): Part[] {
  const parts: Part[] = [];
  // \s* handles both ```chart\n{...} and ```chart {...} (same line)
  // (?:```|$) handles truncated output that never closes
  const regex = /```chart\s*([\s\S]*?)(?:```|$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(output)) !== null) {
    if (match.index > lastIndex) {
      const text = output.slice(lastIndex, match.index).trim();
      if (text) parts.push({ type: 'text', content: text });
    }
    const raw = match[1].trim();
    if (raw) parts.push({ type: 'chart', content: raw });
    lastIndex = match.index + match[0].length;
    if (lastIndex >= output.length) break;
  }

  const remaining = output.slice(lastIndex).trim();
  if (remaining) parts.push({ type: 'text', content: remaining });
  return parts;
}

function applyInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:11px;font-family:monospace;">$1</code>');
}

function renderTable(block: string): string {
  const rows = block.trim().split('\n').filter(r => r.trim());
  if (rows.length < 2) return block;

  const isSep = (r: string) => /^\|[\s\-:|]+\|$/.test(r.trim());
  const parseCells = (row: string) => row.split('|').slice(1, -1).map(c => c.trim());

  const headerCells = parseCells(rows[0])
    .map(c => `<th style="padding:10px 14px;text-align:left;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;background:#f8fafc;border-bottom:2px solid #e2e8f0;white-space:nowrap;">${applyInline(c)}</th>`)
    .join('');

  const dataRows = rows.slice(1).filter(r => !isSep(r));
  const bodyRows = dataRows.map((row, i) => {
    const cells = parseCells(row).map((c, j) =>
      `<td style="padding:10px 14px;font-size:13px;color:${j === 0 ? '#111827' : '#4b5563'};font-weight:${j === 0 ? '500' : '400'};border-bottom:1px solid #f3f4f6;">${applyInline(c)}</td>`
    ).join('');
    return `<tr style="background:${i % 2 === 1 ? '#fafafa' : 'white'};">${cells}</tr>`;
  }).join('');

  return `<div style="overflow-x:auto;margin:16px 0;border-radius:10px;border:1px solid #e2e8f0;"><table style="width:100%;border-collapse:collapse;font-family:-apple-system,sans-serif;"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table></div>`;
}

export function renderMarkdown(md: string): string {
  const preserved = new Map<string, string>();
  let idx = 0;

  // Step 0: handle inline code and escape its content so it renders correctly
  let processed = md.replace(/`([^`]+)`/g, (_, code) => {
    const escaped = code.replace(/&(?!amp;|lt;|gt;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const tok = `\x00HBTOK${idx++}\x00`;
    preserved.set(tok, `<code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:12px;font-family:monospace;">${escaped}</code>`);
    return tok;
  });

  // Step 1: preserve raw HTML tags (e.g. LLM-generated table tags)
  processed = processed.replace(/<\/?[a-zA-Z][a-zA-Z0-9]*\b[^>]*>/g, (match) => {
    const tok = `\x00HBTOK${idx++}\x00`;
    preserved.set(tok, match);
    return tok;
  });

  // Step 2: collect markdown pipe tables line-by-line (handles blank lines between rows —
  // Claude often emits a blank line after every row, which breaks a simple regex approach)
  {
    const lines = processed.split('\n');
    const parts: string[] = [];
    let tableLines: string[] = [];

    const flushTable = () => {
      if (tableLines.length === 0) return;
      const nonBlank = tableLines.filter(l => l.trim() !== '');
      const isPipeRow = (l: string) => l.trimStart().startsWith('|');
      if (nonBlank.filter(isPipeRow).length >= 2) {
        const tok = `\x00HBTOK${idx++}\x00`;
        preserved.set(tok, renderTable(nonBlank.join('\n')));
        parts.push(tok);
      } else {
        parts.push(...tableLines);
      }
      tableLines = [];
    };

    for (const line of lines) {
      if (line.trimStart().startsWith('|')) {
        tableLines.push(line);
      } else if (line.trim() === '' && tableLines.length > 0) {
        tableLines.push(line); // blank line mid-table — keep collecting
      } else {
        flushTable();
        parts.push(line);
      }
    }
    flushTable();
    processed = parts.join('\n');
  }

  // Step 3: escape HTML in the remaining text only
  processed = processed
    .replace(/&(?!amp;|lt;|gt;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Step 4: apply markdown transforms to the safe text
  processed = processed
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;margin:14px 0 4px;color:#0f172a;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:700;margin:20px 0 6px;color:#0f172a;padding-top:4px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:700;margin:20px 0 8px;color:#0f172a;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:5px 0;padding-left:4px;list-style:decimal;">$1</li>')
    .replace(/^[-*] (.+)$/gm, '<li style="margin:5px 0;padding-left:4px;">$1</li>')
    .replace(/(<li[^>]*>.*?<\/li>\n?)+/gs, s => `<ul style="margin:8px 0;padding-left:20px;list-style:disc;">${s}</ul>`)
    .replace(/\n\n+/g, '</p><p style="margin:8px 0;line-height:1.75;">')
    .trim();

  // Step 5: re-inject the preserved HTML blocks
  for (const [tok, html] of preserved.entries()) {
    processed = processed.replace(tok, html);
  }

  return processed;
}

function ChartImage({ spec }: { spec: string }) {
  const url = buildQuickChartUrl(spec);
  if (!url) return null;
  let title = '';
  try { title = JSON.parse(spec).title || ''; } catch {}

  return (
    <div className="my-5 rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {title && <p className="text-sm font-semibold text-slate-700 px-4 pt-4">{title}</p>}
      <img
        src={url}
        alt={title || 'Chart'}
        className="w-full"
        loading="lazy"
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    </div>
  );
}

// ── Confidence scoring ──────────────────────────────────────────────────────
export function computeConfidence(output: string): { score: number; level: 'high' | 'medium' | 'low'; reason: string } {
  const words = output.split(/\s+/).length;
  const numbers = (output.match(/\b\d+\.?\d*\b/g) || []).length;
  const hasTable = output.includes('|');
  const hasHeadings = output.includes('##');
  const hasUncertainty = /\b(uncertain|unclear|unable|no data|not available|insufficient|error|failed|limited data)\b/i.test(output);

  let score = 40;
  if (words > 200) score += 12;
  if (words > 450) score += 10;
  if (numbers > 5) score += 10;
  if (numbers > 15) score += 10;
  if (hasTable) score += 10;
  if (hasHeadings) score += 8;
  if (hasUncertainty) score -= 18;

  score = Math.min(97, Math.max(28, score));
  const level = score >= 75 ? 'high' : score >= 55 ? 'medium' : 'low';
  const reason =
    level === 'high' ? `${numbers} data points — strong coverage` :
    level === 'medium' ? 'Moderate data coverage — some gaps' :
    'Limited data — verify key points independently';

  return { score, level, reason };
}

// ── Section callout detection ─────────────────────────────────────────────────
export function injectCallouts(md: string): string {
  type CalloutStyle = { bg: string; border: string; label: string; labelColor: string };
  const styles: Record<string, CalloutStyle> = {
    risk:        { bg: '#fff7ed', border: '#f97316', label: 'Risk',        labelColor: '#9a3412' },
    alert:       { bg: '#fff7ed', border: '#f97316', label: 'Alert',       labelColor: '#9a3412' },
    warning:     { bg: '#fff7ed', border: '#f97316', label: 'Warning',     labelColor: '#9a3412' },
    signal:      { bg: '#eff6ff', border: '#3b82f6', label: 'Signal',      labelColor: '#1d4ed8' },
    trend:       { bg: '#eff6ff', border: '#3b82f6', label: 'Trend',       labelColor: '#1d4ed8' },
    opportunity: { bg: '#f0fdf4', border: '#22c55e', label: 'Opportunity', labelColor: '#15803d' },
    finding:     { bg: '#f8fafc', border: '#94a3b8', label: 'Finding',     labelColor: '#475569' },
    status:      { bg: '#f0fdf4', border: '#22c55e', label: 'Status',      labelColor: '#15803d' },
    recommendation: { bg: '#f0fdf4', border: '#22c55e', label: 'Recommendation', labelColor: '#15803d' },
    'key takeaway':  { bg: '#f8fafc', border: '#94a3b8', label: 'Key Takeaway',  labelColor: '#475569' },
    'bottom line':   { bg: '#f8fafc', border: '#94a3b8', label: 'Bottom Line',   labelColor: '#475569' },
    'action required': { bg: '#fff7ed', border: '#f97316', label: 'Action Required', labelColor: '#9a3412' },
    'why this matters': { bg: '#eff6ff', border: '#3b82f6', label: 'Why This Matters', labelColor: '#1d4ed8' },
  };

  const pattern = Object.keys(styles).map(k => k.replace(/\s+/g, '\\s+')).join('|');
  const regex = new RegExp(
    `(\\*\\*(${pattern})[:\\s]*\\*\\*[^\\n]*(?:\\n(?![#\\n]).*)*)`  ,
    'gi'
  );

  return md.replace(regex, (match, _, key) => {
    const s = styles[(key as string).toLowerCase().trim()] ?? styles.finding;
    const body = match.replace(/\*\*/g, '').replace(/^[^:]+:\s*/, '').trim();
    return `\n<div style="background:${s.bg};border-left:3px solid ${s.border};border-radius:0 8px 8px 0;padding:10px 14px;margin:14px 0;font-size:13px;line-height:1.65;"><span style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${s.labelColor};margin-bottom:4px;">${s.label}</span><br>${body}</div>\n`;
  });
}

export function ReportRenderer({ output, compact = false }: { output: string; compact?: boolean }) {
  const parts = parseReport(output);

  return (
    <div className={compact ? 'text-sm' : ''}>
      {parts.map((part, i) =>
        part.type === 'chart' ? (
          <ChartImage key={i} spec={part.content} />
        ) : (
          <div
            key={i}
            className="prose prose-sm max-w-none text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(injectCallouts(part.content)) }}
          />
        )
      )}
    </div>
  );
}
