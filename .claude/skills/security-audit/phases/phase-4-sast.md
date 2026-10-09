# Phase 4 — Code-Level SAST

**Goal:** Scan source code for OWASP Top 10 and API-specific vulnerabilities using pattern matching.

**References:**
- Read `skills/security-audit/references/owasp-top-10-checks.md` for OWASP patterns
- If `has_api`, `has_graphql`, `has_websocket`, or `has_grpc`: read `skills/security-audit/references/api-security-checks.md`
- If `is_ai_ml = true`: read `skills/security-audit/references/ai-ml-security-checks.md`
- If `is_ecommerce = true`: read `skills/security-audit/references/ecommerce-payments-checks.md`
- If `is_web3 = true`: read `skills/security-audit/references/web3-smart-contract-checks.md`
- If `is_mobile = true`: read `skills/security-audit/references/mobile-app-checks.md`
- If `is_desktop = true`: read `skills/security-audit/references/electron-desktop-checks.md`
- If `is_browser_extension = true`: read `skills/security-audit/references/browser-extension-checks.md`
- If `is_cms = true`: read `skills/security-audit/references/wordpress-cms-checks.md`

## Steps

1. Based on the STACK_PROFILE, select relevant language-specific patterns. Skip patterns for absent languages.

2. For each OWASP category (A01–A10), run Grep searches:
   - A01: Broken Access Control — IDOR, missing auth middleware, path traversal, CORS
   - A02: Cryptographic Failures — weak hashing, weak encryption, hardcoded keys
   - A03: Injection — SQLi, NoSQLi, command injection, XSS, LDAP injection
   - A04: Insecure Design — verbose errors, missing rate limiting, missing validation
   - A05: Security Misconfiguration — debug mode, XXE, default credentials
   - A06: Vulnerable Components — (covered in Phase 3)
   - A07: Auth Failures — (covered in Phase 7)
   - A08: Data Integrity — unsafe deserialization, missing SRI
   - A09: Logging Failures — (covered in Phase 8)
   - A10: SSRF — HTTP client with user-controlled URLs

3. **API-specific checks** (if applicable):
   - REST: mass assignment, missing input validation, missing pagination, BOLA
   - GraphQL: query depth limiting, complexity analysis, introspection, resolver auth
   - WebSocket: connection auth, origin validation, message validation, rate limiting
   - gRPC: TLS, auth interceptors, input validation, deadlines, reflection

4. **Platform-specific checks**: Run checks from loaded platform references (AI/ML prompt injection, Solidity reentrancy, Electron nodeIntegration, etc.)

5. **For large codebases (>200 source files):** Launch parallel Agent sub-tasks:
   - Split file list into batches of ~50 files
   - For each batch, invoke Agent with:
     ```
     SCAN_TYPE: sast
     FILES: [comma-separated file paths]
     CHECKS: [name:pattern pairs for this project's languages]
     CONTEXT: language=<lang>, framework=<framework>, phase=sast
     ```
   - Launch all batch agents in parallel
   - Collect, deduplicate (same file:line), and merge results

6. **Verify each match** — read 5-10 lines of surrounding context:
   - Apply false positive rules from `skills/security-audit/references/false-positives.md`
   - Check if match is in a comment, test file, or uses sanitized input
   - Check for compensating controls nearby

7. Record findings with: file, line, severity, OWASP category, CWE, snippet, description, remediation.
