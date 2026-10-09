# Phase 9 — Report & Remediation

**Goal:** Compile findings, score severity, map compliance, auto-remediate, and generate markdown report + remediation tickets.

**References:**
- Read `skills/security-audit/references/severity-scoring.md` for CVSS scoring and pre-scored findings
- Read `skills/security-audit/references/compliance-mapping.md` for CWE/OWASP/SOC2/PCI-DSS/HIPAA/GDPR
- Read `skills/security-audit/references/auto-remediation-patterns.md` for code transforms and safety guardrails

## 9-pre. Cross-phase deduplication and confidence filtering

**Step 1: Deduplicate** across all phases:
1. Same file + same line → keep the most specific phase's finding
2. Same vulnerability type + different files → keep all (separate instances)
3. Same concept at different specificity → keep the more specific
4. CORS/headers in Phase 2 and Phase 4 → keep Phase 2

**Step 2: Confidence scoring** — assign 1-10 to each finding:
- **10**: Exact pattern match with verified context (private key, AKIA prefix)
- **8-9**: Strong match with supporting context (SQL concat with req.params)
- **6-7**: Ambiguous context (eval() maybe in build config)
- **4-5**: Weak indicator (missing header, might be at proxy level)
- **1-3**: Speculative only

**Only confidence >= 7 in main report.** Confidence 4-6 → appendix. Below 4 → dropped.

## 9a. Score and classify

1. Check **pre-scored findings table** in severity-scoring.md first. Use that score if matched.
2. For others, use simplified CVSS: `round((AV × AC × PR × UI) × max(C, I, A) × 10, 1)`
3. Apply severity adjustments from false-positives.md (escalate auth/payment, reduce test/dev)
4. Map to compliance using Quick Reference table in compliance-mapping.md
5. Sort by severity (Critical first), then CVSS within level.

## 9b. Auto-remediate

Read `auto-remediation-patterns.md` for exact transforms and safety rules.

**Safety checks before any fix:**
1. Read 20 lines of context
2. Detect code style (indentation, quotes, semicolons)
3. Max 15 lines of changes per fix
4. Warn if uncommitted git changes exist
5. Re-read modified file after fix to verify syntax

**Auto-fix Low/Medium silently:** security headers, .gitignore entries, cookie flags, SameSite, Docker image pinning, .dockerignore, sensitive console.log removal, Referrer-Policy

**Auto-fix High/Critical with confirmation:** SQL parameterization, eval/exec replacement, auth middleware, innerHTML→textContent, JWT algorithm whitelist, pickle→safe_load, hardcoded secrets→env vars, CSRF middleware, command injection, TLS verification

**Never auto-fix:** Multi-file refactors, schema changes, API key rotation, production config, 3+ file changes

## 9c. Generate markdown report

Read `skills/security-audit/assets/report-template.md` and fill in:

1. **Executive Summary** — risk rating, severity counts, stack, top 3 findings
2. **Phase Results** — status icon + count per phase
3. **Positive Security Practices** — list what the project does RIGHT (hashing, HTTPS, validation, etc.)
4. **Findings by Severity** — box-drawing cards with file:line, CWE, CVSS, confidence, snippet, remediation, status
5. **Lower Confidence Findings** — appendix for confidence 4-6
6. **Compliance Mapping** — table with CWE/OWASP/SOC2/PCI-DSS/HIPAA/GDPR
7. **Remediation Summary** — auto-fixed vs manual + follow-up actions
8. **Dependency Audit** — CVE summary from Phase 3
9. **Secrets Scan** — masked values from Phase 6
10. **IaC Review** — infrastructure findings from Phase 5
11. **Re-audit Instructions**

Write to `SECURITY-AUDIT-REPORT.md` in project root.

## 9d. Generate remediation tickets

For each High/Critical finding, create ticket in `docs/security-tickets/`:

```
docs/security-tickets/CRITICAL-001-sql-injection-users-api.md
```

Ticket format:
```
# [SEVERITY-NNN] Short Title

**Severity / CVSS / CWE / File / Confidence / Found / Status**

## Description | Steps to Reproduce | Recommended Fix | Compliance Impact | References
```

On recheck, update Status to RESOLVED for fixed tickets.
