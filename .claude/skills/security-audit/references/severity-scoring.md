# Severity Scoring Rubric

Reference file for Phase 9 (Report & Remediation). Provides a CVSS-style scoring framework adapted for automated code auditing.

---

## Severity Levels

| Level | CVSS Range | Description | SLA Guidance |
|---|---|---|---|
| **Critical** | 9.0–10.0 | Actively exploitable; leads to full system compromise, data breach, or RCE | Fix immediately (within 24 hours) |
| **High** | 7.0–8.9 | Exploitable with moderate effort; leads to significant data exposure or privilege escalation | Fix within 7 days |
| **Medium** | 4.0–6.9 | Exploitable under specific conditions; limited impact or requires chaining | Fix within 30 days |
| **Low** | 0.1–3.9 | Minor issues; defense-in-depth improvements, best practice violations | Fix within 90 days |
| **Info** | 0.0 | Observations, recommendations, no direct security impact | Address at convenience |

---

## Scoring Factors

### Attack Vector (AV)

| Value | Score Weight | Description | Examples |
|---|---|---|---|
| Network | 1.0 | Exploitable over the network | Web endpoints, APIs |
| Adjacent | 0.75 | Requires adjacent network access | Same VLAN, Bluetooth |
| Local | 0.5 | Requires local access | File read, local exploit |
| Physical | 0.25 | Requires physical access | USB attacks, hardware |

### Attack Complexity (AC)

| Value | Score Weight | Description | Examples |
|---|---|---|---|
| Low | 1.0 | No special conditions needed | Direct API call, simple payload |
| Medium | 0.6 | Some conditions required | Specific config, race condition |
| High | 0.3 | Specialized conditions needed | Complex chain, specific timing |

### Privileges Required (PR)

| Value | Score Weight | Description | Examples |
|---|---|---|---|
| None | 1.0 | No authentication needed | Unauthenticated endpoints |
| Low | 0.7 | Basic user account needed | Authenticated user attacks |
| High | 0.3 | Admin/privileged access needed | Admin panel vulnerabilities |

### User Interaction (UI)

| Value | Score Weight | Description | Examples |
|---|---|---|---|
| None | 1.0 | No user interaction needed | Automated exploitation |
| Required | 0.5 | Victim must perform action | Click link, visit page |

### Impact — Confidentiality (C)

| Value | Score Weight | Description |
|---|---|---|
| High | 1.0 | Full data breach, all data accessible |
| Medium | 0.5 | Partial data exposure, some records |
| Low | 0.2 | Minimal information disclosure |
| None | 0.0 | No confidentiality impact |

### Impact — Integrity (I)

| Value | Score Weight | Description |
|---|---|---|
| High | 1.0 | Full system modification, code execution |
| Medium | 0.5 | Partial data modification |
| Low | 0.2 | Minor data alteration |
| None | 0.0 | No integrity impact |

### Impact — Availability (A)

| Value | Score Weight | Description |
|---|---|---|
| High | 1.0 | Full system DoS, service outage |
| Medium | 0.5 | Partial service degradation |
| Low | 0.2 | Minor performance impact |
| None | 0.0 | No availability impact |

---

## Simplified Scoring Formula

```
Base Score = round(
  (AV × AC × PR × UI) ×               # Exploitability
  max(C, I, A) ×                        # Maximum impact
  10                                     # Scale to 0-10
, 1)
```

This is a simplified approximation. For precise CVSS v3.1 scores, use the official formula, but this provides actionable severity for automated findings.

---

## Scoring by Finding Category

### Pre-Scored Findings

These common findings have pre-assigned severity to ensure consistency:

#### Critical (9.0–10.0)

| Finding | Score | Rationale |
|---|---|---|
| SQL injection (unauthenticated) | 9.8 | AV:N/AC:L/PR:N — full DB access |
| Remote code execution | 10.0 | AV:N/AC:L/PR:N — full system compromise |
| Hardcoded production credentials | 9.5 | Direct access to production systems |
| Private key in repository | 9.5 | Impersonation, decryption of traffic |
| Deserialization of untrusted data (RCE) | 9.8 | AV:N/AC:L/PR:N — code execution |
| Authentication bypass | 9.8 | AV:N/AC:L/PR:N — access to all accounts |
| AWS root credentials exposed | 10.0 | Full cloud account compromise |

#### High (7.0–8.9)

| Finding | Score | Rationale |
|---|---|---|
| XSS (stored, unauthenticated) | 8.1 | AV:N/AC:L/PR:N/UI:R — session theft |
| SQL injection (authenticated) | 8.5 | AV:N/AC:L/PR:L — DB access with user account |
| SSRF (internal network) | 8.0 | AV:N/AC:L/PR:L — internal service access |
| Missing auth on sensitive endpoint | 8.5 | AV:N/AC:L/PR:N — data exposure |
| Hardcoded API key (third-party) | 7.5 | Service abuse, data access |
| Command injection (authenticated) | 8.5 | AV:N/AC:L/PR:L — system commands |
| Privileged container (K8s/Docker) | 7.5 | Container escape risk |
| JWT algorithm none accepted | 8.5 | AV:N/AC:L/PR:N — token forgery |
| .env file committed | 7.5 | Exposure of all environment secrets |
| Public S3 bucket with data | 8.0 | Data breach |

#### Medium (4.0–6.9)

| Finding | Score | Rationale |
|---|---|---|
| XSS (reflected) | 6.1 | AV:N/AC:L/PR:N/UI:R — limited impact |
| CSRF on state-changing endpoint | 6.5 | AV:N/AC:L/PR:N/UI:R — action on behalf of user |
| Missing rate limiting (auth endpoints) | 7.0 | Enables brute force on login/register |
| Insecure cookie flags | 5.0 | Session theft conditions |
| Path traversal (limited) | 6.0 | AV:N/AC:L/PR:L — file read |
| Missing CORS restrictions | 5.5 | Cross-origin data theft with credentials |
| Weak password hashing (bcrypt cost < 10) | 5.0 | Faster offline cracking |
| Debug mode indicators | 5.5 | Information disclosure |
| Unpinned base image | 4.5 | Supply chain risk |
| Missing input validation | 4.0 | Potential injection vector |

#### Low (0.1–3.9)

| Finding | Score | Rationale |
|---|---|---|
| Missing security headers | 3.0 | Defense-in-depth only |
| Missing HSTS preload | 2.0 | Already using HSTS |
| Verbose error messages (non-auth) | 3.0 | Information disclosure |
| Console.log with data | 2.5 | Client-side info leak |
| Missing SRI on CDN scripts | 3.5 | Supply chain, requires CDN compromise |
| Source maps in production | 2.0 | Code disclosure |
| Missing Permissions-Policy | 2.0 | Defense-in-depth |
| Dependency with low-severity CVE | 2.5 | Limited exploitability |

#### Informational (0.0)

| Finding | Score | Rationale |
|---|---|---|
| No MFA implementation | 0.0 | Recommendation only |
| Missing monitoring integration | 0.0 | Operational improvement |
| No log correlation IDs | 0.0 | Operational improvement |
| Using deprecated (but not vulnerable) API | 0.0 | Maintenance recommendation |
| Missing automated security testing | 0.0 | Process recommendation |

---

## Adjustments

### Severity Escalation

Increase severity by one level when:
- Finding is in authentication/authorization path
- Finding affects payment/financial data
- Finding is in a public-facing endpoint
- Multiple findings chain together for greater impact

### Severity Reduction

Decrease severity by one level when:
- Finding is in internal-only endpoint (not exposed to internet)
- Compensating controls exist (WAF, network segmentation)
- Finding requires unlikely preconditions
- Application is pre-production/staging only

---

## Risk Rating Calculation

The overall risk rating for the project is based on the highest severity finding and the aggregate:

| Condition | Overall Rating |
|---|---|
| Any Critical finding | **Critical** |
| ≥3 High findings (no Critical) | **High** |
| 1-2 High findings (no Critical) | **High** |
| ≥5 Medium findings (no High/Critical) | **Medium** |
| 1-4 Medium findings (no High/Critical) | **Medium** |
| Only Low/Info findings | **Low** |
| No findings | **Pass** |
