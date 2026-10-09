# Phase 10 — PDF Report Generation

**Goal:** Generate a professionally styled PDF (or HTML fallback) of the security audit report.

**Reference:** Read `skills/security-audit/references/pdf-report-guide.md` for generation strategies, CSS, and fallback methods.

## 10a. Detect available PDF tooling

Try each in order, use the first that succeeds:

1. **Puppeteer/Playwright**: `npx puppeteer --version 2>/dev/null || npx playwright --version 2>/dev/null`
2. **pandoc + wkhtmltopdf**: `pandoc --version 2>/dev/null && wkhtmltopdf --version 2>/dev/null`
3. **pandoc + LaTeX**: `pandoc --version 2>/dev/null && xelatex --version 2>/dev/null`
4. **Python pdfkit/weasyprint**: `python3 -c "import pdfkit" 2>/dev/null || python3 -c "import weasyprint" 2>/dev/null`
5. **HTML fallback**: always available

## 10b. Convert markdown to styled HTML

1. Read `SECURITY-AUDIT-REPORT.md`
2. Convert to HTML with full CSS from PDF reference
3. Style: cover page, dashboard, severity badges, code blocks, tables, page breaks, header/footer

## 10c. Generate PDF

- Format: A4, margins 20/15/20/15mm, print backgrounds
- Output: `SECURITY-AUDIT-REPORT.pdf`

## 10d. Fallback to HTML

If no PDF tool: write `SECURITY-AUDIT-REPORT.html` with embedded CSS.
```
📄 No PDF tool detected. HTML report generated instead.
Open SECURITY-AUDIT-REPORT.html in browser → Print (Ctrl+P) → Save as PDF
```

## 10e. Output summary

```
╔══════════════════════════════════════════════════════════════╗
║  📁 REPORT FILES GENERATED                                  ║
╠══════════════════════════════════════════════════════════════╣
║  📝 SECURITY-AUDIT-REPORT.md   ·········· Markdown report   ║
║  📄 SECURITY-AUDIT-REPORT.pdf  ·········· PDF report         ║
║  (or .html if PDF tools not available)                      ║
╚══════════════════════════════════════════════════════════════╝
```
