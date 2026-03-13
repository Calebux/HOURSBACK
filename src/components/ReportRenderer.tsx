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

function buildQuickChartUrl(spec: string): string | null {
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

function parseReport(output: string): Part[] {
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

function renderMarkdown(md: string): string {
  // Extract and render tables first before any other processing
  const withTables = md.replace(/^(\|.+\|\n?){2,}/gm, block => renderTable(block));

  return withTables
    .replace(/&(?!amp;|lt;|gt;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;margin:14px 0 4px;color:#0f172a;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:700;margin:20px 0 6px;color:#0f172a;padding-top:4px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:700;margin:20px 0 8px;color:#0f172a;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:#e2e8f0;padding:1px 4px;border-radius:3px;font-size:12px;font-family:monospace;">$1</code>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:5px 0;padding-left:4px;list-style:decimal;">$1</li>')
    .replace(/^[-*] (.+)$/gm, '<li style="margin:5px 0;padding-left:4px;">$1</li>')
    .replace(/(<li[^>]*>.*?<\/li>\n?)+/gs, s => `<ul style="margin:8px 0;padding-left:20px;list-style:disc;">${s}</ul>`)
    .replace(/\n\n+/g, '</p><p style="margin:8px 0;line-height:1.75;">')
    .trim();
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
            dangerouslySetInnerHTML={{ __html: renderMarkdown(part.content) }}
          />
        )
      )}
    </div>
  );
}
