# Phase 6 — Secrets & Credentials

**Goal:** Detect hardcoded secrets, API keys, tokens, and credentials.

**References:**
- Read `skills/security-audit/references/secrets-patterns.md` for 30+ regex patterns
- If `is_baas = true`: check BaaS-specific key exposure per `skills/security-audit/references/baas-security-checks.md`
- If `is_ai_ml = true`: check AI/ML API keys per `skills/security-audit/references/ai-ml-security-checks.md`
- If `is_web3 = true`: check private keys per `skills/security-audit/references/web3-smart-contract-checks.md`

## Steps

1. **File name scan**: Check for files that commonly contain secrets (`.env`, `credentials.json`, `*.pem`, `*.key`, etc.) tracked in git or not in `.gitignore`.

2. **Pattern matching**: Run Grep with each regex pattern category:
   - Cloud provider keys (AWS, GCP, Azure)
   - API keys & tokens (GitHub, Stripe, Slack, Twilio, SendGrid, etc.)
   - Database connection strings
   - Private keys
   - JWT tokens
   - Generic patterns (api_key, secret, password, token assignments)

3. **Apply exclusion rules**: Filter false positives — test files, placeholders, docs, lock files, public keys, empty assignments.

4. **Git history scan** (if git repo): For highest-risk patterns (AWS keys, private keys, Stripe live keys):
   ```
   git log -p --all -S '<pattern>' -- <relevant files>
   ```
   Flag secrets committed and removed — they may still be valid.

5. **BaaS key audit** (if `is_baas = true`):
   - **Supabase**: Check if `service_role` key is in any `NEXT_PUBLIC_*`, `VITE_*`, or `REACT_APP_*` env var or client code
   - **Firebase**: Check if `firebase-admin` SDK or service account JSON is in client-accessible code
   - Audit all public-prefix env vars for service keys or admin tokens

6. Record findings with severity, masked secret (first/last 4 chars), and remediation guidance.
