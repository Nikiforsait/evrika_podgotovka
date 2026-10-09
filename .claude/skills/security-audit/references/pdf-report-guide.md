# PDF Report Generation Guide

Reference file for Phase 9e (PDF Report). Provides strategies for generating a styled PDF security audit report from the markdown report.

---

## Generation Strategy

The PDF report is generated **after** the markdown report (`SECURITY-AUDIT-REPORT.md`) is written. The strategy uses a cascading fallback approach — try the best available tool, falling back gracefully.

### Priority Order

1. **Puppeteer / Playwright** (if Node.js project with either installed) — highest quality
2. **pandoc + wkhtmltopdf** (if installed) — good quality, widely available
3. **pandoc + LaTeX** (if installed) — excellent for text-heavy reports
4. **python + markdown + pdfkit** (if Python available) — good fallback
5. **Built-in HTML generation** — always available; generates HTML that the user can print to PDF

---

## Method 1: Puppeteer (Node.js)

**Detection:** Check if `puppeteer` or `playwright` is available:
```bash
npx puppeteer --version 2>/dev/null || npx playwright --version 2>/dev/null
```

**Generate:** Write a temporary Node.js script to convert HTML to PDF:

```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');
const { marked } = require('marked');

async function generatePDF() {
  const md = fs.readFileSync('SECURITY-AUDIT-REPORT.md', 'utf8');
  const html = generateStyledHTML(md);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: 'SECURITY-AUDIT-REPORT.pdf',
    format: 'A4',
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#666;">Security Audit Report — Confidential</div>',
    footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#666;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
  });
  await browser.close();
}
```

---

## Method 2: pandoc

**Detection:**
```bash
pandoc --version 2>/dev/null
```

**Generate:**
```bash
pandoc SECURITY-AUDIT-REPORT.md \
  -o SECURITY-AUDIT-REPORT.pdf \
  --pdf-engine=wkhtmltopdf \
  --css=security-report-styles.css \
  --metadata title="Security Audit Report" \
  -V margin-top=20mm \
  -V margin-right=15mm \
  -V margin-bottom=20mm \
  -V margin-left=15mm \
  2>/dev/null
```

If `wkhtmltopdf` isn't available, try LaTeX engine:
```bash
pandoc SECURITY-AUDIT-REPORT.md \
  -o SECURITY-AUDIT-REPORT.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  -V colorlinks=true \
  2>/dev/null
```

---

## Method 3: Python pdfkit/weasyprint

**Detection:**
```bash
python3 -c "import pdfkit" 2>/dev/null || python3 -c "import weasyprint" 2>/dev/null
```

**Generate (pdfkit):**
```python
import pdfkit
import markdown

with open('SECURITY-AUDIT-REPORT.md', 'r') as f:
    md_content = f.read()

html = markdown.markdown(md_content, extensions=['tables', 'fenced_code'])
styled_html = f"""<!DOCTYPE html>
<html><head><style>{CSS_STYLES}</style></head>
<body>{html}</body></html>"""

pdfkit.from_string(styled_html, 'SECURITY-AUDIT-REPORT.pdf', options={
    'page-size': 'A4',
    'margin-top': '20mm',
    'margin-right': '15mm',
    'margin-bottom': '20mm',
    'margin-left': '15mm',
    'encoding': 'UTF-8',
    'footer-center': 'Page [page] of [topage]',
    'footer-font-size': '8'
})
```

---

## Method 4: HTML Fallback (Always Available)

If no PDF tool is available, generate a self-contained HTML file that the user can open in a browser and print to PDF (Ctrl/Cmd + P → Save as PDF).

Write `SECURITY-AUDIT-REPORT.html` alongside the markdown report.

---

## PDF Styling — CSS

The following CSS is used for HTML-to-PDF conversion across all methods. It replicates the Unicode box-drawing visual style in a print-friendly format:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --critical: #DC2626;
  --high: #EA580C;
  --medium: #CA8A04;
  --low: #2563EB;
  --info: #6B7280;
  --pass: #16A34A;
  --bg-dark: #1E293B;
  --bg-card: #F8FAFC;
  --border: #E2E8F0;
  --text: #1E293B;
  --text-secondary: #64748B;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: var(--text);
  background: white;
}

/* Cover / Header */
.report-header {
  background: var(--bg-dark);
  color: white;
  padding: 40px;
  margin: -20mm -15mm 30px -15mm;
  page-break-after: always;
}

.report-header h1 {
  font-size: 28pt;
  font-weight: 700;
  margin-bottom: 8px;
}

.report-header .subtitle {
  font-size: 12pt;
  color: #94A3B8;
}

.report-header .meta {
  margin-top: 24px;
  font-size: 10pt;
  color: #CBD5E1;
}

.report-header .meta dt {
  font-weight: 600;
  color: white;
  display: inline;
}

/* Severity badges */
.severity {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 9pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.severity-critical {
  background: var(--critical);
  color: white;
}

.severity-high {
  background: var(--high);
  color: white;
}

.severity-medium {
  background: var(--medium);
  color: white;
}

.severity-low {
  background: var(--low);
  color: white;
}

.severity-info {
  background: #F1F5F9;
  color: var(--info);
}

/* Finding cards */
.finding-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 16px;
  page-break-inside: avoid;
  overflow: hidden;
}

.finding-card-header {
  background: var(--bg-card);
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.finding-card-body {
  padding: 16px;
}

.finding-meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 16px;
  font-size: 10pt;
  margin-bottom: 12px;
}

.finding-meta dt {
  font-weight: 600;
  color: var(--text-secondary);
}

/* Code blocks */
pre, code {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

pre {
  background: #1E293B;
  color: #E2E8F0;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 9pt;
  line-height: 1.5;
  overflow-x: auto;
  margin: 8px 0;
}

code {
  background: #F1F5F9;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 9.5pt;
}

pre code {
  background: none;
  padding: 0;
}

/* Summary dashboard */
.dashboard {
  background: var(--bg-dark);
  color: white;
  border-radius: 8px;
  padding: 24px;
  margin: 20px 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  text-align: center;
}

.dashboard-item {
  padding: 12px;
}

.dashboard-item .count {
  font-size: 24pt;
  font-weight: 700;
}

.dashboard-item .label {
  font-size: 9pt;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Progress bars */
.progress-bar {
  height: 8px;
  background: #334155;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
}

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 10pt;
}

th {
  background: var(--bg-card);
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid var(--border);
}

td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}

tr:nth-child(even) {
  background: #FAFBFC;
}

/* Section headers */
h2 {
  font-size: 16pt;
  font-weight: 700;
  margin-top: 30px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border);
  page-break-after: avoid;
}

h3 {
  font-size: 13pt;
  font-weight: 600;
  margin-top: 20px;
  margin-bottom: 8px;
  page-break-after: avoid;
}

/* Remediation status */
.remediation-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 9pt;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-fixed {
  background: #DCFCE7;
  color: #166534;
}

.status-manual {
  background: #FEF3C7;
  color: #92400E;
}

/* Phase status list */
.phase-list {
  list-style: none;
  padding: 0;
}

.phase-list li {
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  font-size: 10pt;
}

.phase-list .phase-name {
  font-weight: 500;
}

.phase-list .phase-count {
  color: var(--text-secondary);
}

/* Print-specific */
@media print {
  body {
    font-size: 10pt;
  }

  .report-header {
    margin: 0;
    padding: 30px;
  }

  .finding-card {
    page-break-inside: avoid;
  }

  h2, h3 {
    page-break-after: avoid;
  }

  pre {
    white-space: pre-wrap;
    word-break: break-all;
  }
}

/* Confidentiality banner */
.confidential-banner {
  background: var(--critical);
  color: white;
  text-align: center;
  padding: 4px;
  font-size: 8pt;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

---

## PDF Sections and Page Flow

The PDF report should follow this page structure:

### Page 1: Cover Page
```
┌──────────────────────────────────────────────┐
│  🛡️  SECURITY AUDIT REPORT                   │
│                                              │
│  Project:  <name>                            │
│  Date:     <date>                            │
│  Auditor:  Claude Code Security Audit v1.0   │
│  Scope:    Full audit (9 phases)             │
│                                              │
│  Classification: CONFIDENTIAL                │
│                                              │
│  Risk Rating: [CRITICAL/HIGH/MEDIUM/LOW/PASS]│
└──────────────────────────────────────────────┘
```

### Page 2: Executive Summary + Dashboard
- Findings count by severity with visual bars
- Phase completion status
- Stack summary

### Pages 3+: Findings by Severity
- Critical findings first (page break before Critical section)
- Each finding as a styled card
- Code snippets with syntax highlighting

### Compliance Mapping Section
- Full mapping table

### Remediation Summary
- Auto-fixed items with before/after
- Manual items with guidance

### Final Page: Re-Audit Instructions
- How to verify fixes
- How to re-run specific phases

---

## File Output

The PDF generation produces:

| File | Format | Purpose |
|---|---|---|
| `SECURITY-AUDIT-REPORT.md` | Markdown | Primary report (always generated) |
| `SECURITY-AUDIT-REPORT.pdf` | PDF | Print-ready report (when PDF tool available) |
| `SECURITY-AUDIT-REPORT.html` | HTML | Fallback (when no PDF tool available) |

All files are written to the project root.

---

## Execution Order

In Phase 9e:

1. Check which PDF generation method is available (try each in priority order)
2. If a method is found:
   a. Convert the markdown to styled HTML using the CSS above
   b. Convert HTML to PDF using the detected method
   c. Output: `✅ PDF report generated: SECURITY-AUDIT-REPORT.pdf`
3. If NO method is found:
   a. Generate `SECURITY-AUDIT-REPORT.html` with embedded CSS
   b. Output: `📄 HTML report generated: SECURITY-AUDIT-REPORT.html (open in browser → Print → Save as PDF)`
4. Always output the markdown report path as primary reference
