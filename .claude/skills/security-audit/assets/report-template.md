```
╔══════════════════════════════════════════════════════════════════════╗
║  🛡️  SECURITY AUDIT REPORT                                         ║
║  Claude Code Security Audit Skill v1.0                              ║
╠══════════════════════════════════════════════════════════════════════╣
║  Project:    {{PROJECT_NAME}}                                       ║
║  Date:       {{AUDIT_DATE}}                                         ║
║  Scope:      {{SCOPE}}                                              ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Executive Summary

{{EXECUTIVE_SUMMARY}}

```
╔══════════════════════════════════════════════════════════════════════╗
║  📊 FINDINGS OVERVIEW                                               ║
╠══════════════════╦══════════╦════════════════════════════════════════╣
║  🔴 Critical     ║ {{CRITICAL_COUNT}}        ║  {{CRITICAL_BAR}}   ║
║  🟠 High         ║ {{HIGH_COUNT}}            ║  {{HIGH_BAR}}       ║
║  🟡 Medium       ║ {{MEDIUM_COUNT}}          ║  {{MEDIUM_BAR}}     ║
║  🔵 Low          ║ {{LOW_COUNT}}             ║  {{LOW_BAR}}        ║
║  ⚪ Info         ║ {{INFO_COUNT}}            ║  {{INFO_BAR}}       ║
╠══════════════════╬══════════╬════════════════════════════════════════╣
║  Total           ║ {{TOTAL_FINDINGS}}        ║  Risk: {{RISK_RATING}}                ║
╠══════════════════╬══════════╩════════════════════════════════════════╣
║  🔧 Auto-fixed   ║  {{AUTO_FIX_COUNT}} findings                    ║
║  🔒 Manual fix   ║  {{MANUAL_FIX_COUNT}} findings                  ║
╚══════════════════╩══════════════════════════════════════════════════╝
```

### Stack Detected

{{STACK_SUMMARY}}

### Top Findings Requiring Immediate Attention

{{TOP_FINDINGS}}

<!-- Insert up to 3 most critical findings here as mini-cards:
```
┌──────────────────────────────────────────────────────────────┐
│  🔴 #1 — <Title>                                  CVSS: X.X │
│  File: <path>:<line>   CWE: <CWE-XXX>                       │
│  <One-line description>                                      │
└──────────────────────────────────────────────────────────────┘
```
-->

---

## Phase Results

```
  {{PHASE_1_ICON}} Phase 1 — Asset Discovery ·················· {{PHASE_1_COUNT}} findings
  {{PHASE_2_ICON}} Phase 2 — Configuration & Hardening ······· {{PHASE_2_COUNT}} findings
  {{PHASE_3_ICON}} Phase 3 — Dependency Audit ················· {{PHASE_3_COUNT}} findings
  {{PHASE_4_ICON}} Phase 4 — Code-Level SAST ·················· {{PHASE_4_COUNT}} findings
  {{PHASE_5_ICON}} Phase 5 — IaC Review ······················· {{PHASE_5_COUNT}} findings
  {{PHASE_6_ICON}} Phase 6 — Secrets & Credentials ··········· {{PHASE_6_COUNT}} findings
  {{PHASE_7_ICON}} Phase 7 — Auth & Access Control ············ {{PHASE_7_COUNT}} findings
  {{PHASE_8_ICON}} Phase 8 — Logging & Monitoring ············· {{PHASE_8_COUNT}} findings
  {{PHASE_9_ICON}} Phase 9 — Report & Remediation ············· {{PHASE_9_COUNT}} auto-fixed
  {{PHASE_10_ICON}} Phase 10 — PDF Report ····················· Generated
```

---

## Positive Security Practices

{{POSITIVE_PRACTICES}}

<!-- List things the project does well:
- ✅ Passwords hashed with bcrypt (cost factor 12)
- ✅ HTTPS enforced with HSTS header
- ✅ Dependencies up to date — no known CVEs
- ✅ Input validation using Zod on all API routes
- ✅ Secrets stored in environment variables
- etc.
-->

---

## Findings by Severity

### 🔴 Critical

{{CRITICAL_FINDINGS}}

<!-- Each finding should use this card format:
```
┌──────────────────────────────────────────────────────────────┐
│  🔴 CRITICAL — <Title>                          CVSS: <X.X> │
├──────────────────────────────────────────────────────────────┤
│  File:    <path>:<line>                                      │
│  CWE:     <CWE-XXX>                                         │
│  OWASP:   <category>                                        │
├──────────────────────────────────────────────────────────────┤
│  <code snippet>                                              │
├──────────────────────────────────────────────────────────────┤
│  💡 <Remediation guidance>                                   │
│  <🔧 Auto-fixed | 🔒 Manual fix required>                   │
└──────────────────────────────────────────────────────────────┘
```
-->

### 🟠 High

{{HIGH_FINDINGS}}

### 🟡 Medium

{{MEDIUM_FINDINGS}}

### 🔵 Low

{{LOW_FINDINGS}}

### ⚪ Informational

{{INFO_FINDINGS}}

---

## Lower Confidence Findings (Manual Review)

These findings have a confidence score of 4-6/10. They may be false positives or require additional context to evaluate.

{{LOWER_CONFIDENCE_FINDINGS}}

---

## Compliance Mapping

| Finding | CWE | OWASP Top 10 | SOC 2 | PCI-DSS | HIPAA | GDPR |
|---|---|---|---|---|---|---|
{{COMPLIANCE_TABLE}}

---

## Remediation Summary

### 🔧 Auto-Remediated (applied automatically)

{{AUTO_REMEDIATED_LIST}}

### 🔒 Manual Remediation Required

{{MANUAL_REMEDIATION_LIST}}

### 📋 Recommended Follow-Up Actions

{{FOLLOWUP_ACTIONS}}

### 🎫 Remediation Tickets Generated

{{TICKET_COUNT}} tickets created in `docs/security-tickets/`:

{{TICKET_LIST}}

---

## Dependency Audit

{{DEPENDENCY_AUDIT}}

---

## Secrets Scan

{{SECRETS_SCAN}}

---

## Infrastructure as Code Review

{{IAC_REVIEW}}

---

## Re-Audit Instructions

To verify that remediation has been applied:

```
/security-audit recheck
```

To re-run the full audit:

```
/security-audit full
```

To audit a specific phase:

```
/security-audit <phase>
```

Available phases: `discovery`, `config`, `deps`, `sast`, `iac`, `secrets`, `auth`, `logging`

Run a compliance-focused audit:

```
/security-audit --pci
/security-audit --hipaa
/security-audit --soc2
```

---

```
╔══════════════════════════════════════════════════════════════════════╗
║  Generated by Claude Code Security Audit Skill v1.0                 ║
║  This report should be reviewed by a qualified security             ║
║  professional before being used for compliance purposes.            ║
╚══════════════════════════════════════════════════════════════════════╝
```
