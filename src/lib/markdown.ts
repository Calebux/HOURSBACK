export function markdownToHtml(md: string): string {
    if (!md) return '';
    const lines = md.split('\n');
    const html: string[] = [];
    let inList = false;
    let listType = '';
    let inTable = false;
    let tableHeaders: string[] | null = null;
    let tableRows: string[][] = [];

    const closeList = () => {
        if (inList) { html.push(listType === 'ul' ? '</ul>' : '</ol>'); inList = false; listType = ''; }
    };

    const flushTable = () => {
        if (!inTable || !tableHeaders) return;
        // Borders on every cell edge so the table renders correctly in PDF and Google Docs
        const thCells = tableHeaders.map((h, i) =>
            `<th style="padding:10px 14px;text-align:${i === 0 ? 'left' : 'right'};font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.5px;border:1px solid #bfdbfe;">${inline(h)}</th>`
        ).join('');
        const tdRows = tableRows.map((row, ri) =>
            `<tr style="background:${ri % 2 === 0 ? '#ffffff' : '#f8fafc'};">${
                row.map((cell, ci) =>
                    `<td style="padding:9px 14px;font-size:13px;color:${ci === 0 ? '#111827' : '#374151'};font-weight:${ci === 0 ? '600' : '400'};text-align:${ci === 0 ? 'left' : 'right'};border:1px solid #e2e8f0;">${inline(cell)}</td>`
                ).join('')
            }</tr>`
        ).join('');
        html.push(
            `<div style="margin:16px 0;border-radius:8px;border:1px solid #e2e8f0;overflow-x:auto;">`
            + `<table style="width:100%;border-collapse:collapse;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;white-space:nowrap;">`
            + `<thead><tr style="background:#eff6ff;">${thCells}</tr></thead>`
            + `<tbody>${tdRows}</tbody>`
            + `</table></div>`
        );
        inTable = false; tableHeaders = null; tableRows = [];
    };

    const inline = (text: string) =>
        text
            .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background:#e5e7eb;padding:1px 5px;border-radius:4px;font-size:13px;">$1</code>')
            .replace(/\*\*/g, ''); // strip any unmatched ** markers

    for (const raw of lines) {
        const line = raw.trimEnd();

        // Check if we are inside a code block
        if (line.startsWith('```')) {
            continue; // Basic skip for code block wrappers so they don't leak into UI if AI insists on them
        }

        // Markdown table rows start and end with |
        if (/^\|.+\|/.test(line)) {
            const cells = line.split('|').slice(1, -1).map(c => c.trim());
            // Separator row (|---|---|) — skip it
            if (cells.every(c => /^[-:| ]+$/.test(c))) continue;
            if (!inTable) {
                inTable = true;
                tableHeaders = cells;
                tableRows = [];
            } else {
                tableRows.push(cells);
            }
            continue;
        }

        // Non-table line — flush any open table first
        if (inTable) flushTable();

        if (/^---+$/.test(line)) { closeList(); html.push('<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">'); continue; }
        if (/^#### /.test(line)) { closeList(); html.push(`<h4 style="font-size:13px;font-weight:600;color:#374151;margin:12px 0 3px;">${inline(line.slice(5))}</h4>`); continue; }
        if (/^### /.test(line)) { closeList(); html.push(`<h3 style="font-size:15px;font-weight:600;color:#374151;margin:16px 0 4px;">${inline(line.slice(4))}</h3>`); continue; }
        if (/^## /.test(line)) { closeList(); html.push(`<h2 style="font-size:18px;font-weight:700;color:#111827;margin:22px 0 6px;">${inline(line.slice(3))}</h2>`); continue; }
        if (/^# /.test(line)) { closeList(); html.push(`<h1 style="font-size:22px;font-weight:700;color:#111827;margin:28px 0 8px;">${inline(line.slice(2))}</h1>`); continue; }
        const ulMatch = line.match(/^[-*] (.+)/);
        if (ulMatch) { if (!inList || listType !== 'ul') { closeList(); html.push('<ul style="margin:10px 0;padding-left:22px;">'); inList = true; listType = 'ul'; } html.push(`<li style="margin:5px 0;color:#374151;line-height:1.7;">${inline(ulMatch[1])}</li>`); continue; }
        const olMatch = line.match(/^\d+\. (.+)/);
        if (olMatch) { if (!inList || listType !== 'ol') { closeList(); html.push('<ol style="margin:10px 0;padding-left:22px;">'); inList = true; listType = 'ol'; } html.push(`<li style="margin:5px 0;color:#374151;line-height:1.7;">${inline(olMatch[1])}</li>`); continue; }
        if (line.trim() === '') { closeList(); html.push(''); continue; }
        closeList();
        html.push(`<p style="margin:7px 0;color:#374151;line-height:1.8;font-size:15px;">${inline(line)}</p>`);
    }
    if (inTable) flushTable();
    closeList();
    return html.join('\n');
}
