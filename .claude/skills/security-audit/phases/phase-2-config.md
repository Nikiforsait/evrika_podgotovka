# Phase 2 — Configuration & Hardening

**Goal:** Check security headers, CORS, TLS, cookies, debug modes, and hardening.

**Reference:** Read `skills/security-audit/references/config-hardening-checks.md` for detailed patterns.
If `is_cms = true`: also read `skills/security-audit/references/wordpress-cms-checks.md`.
If `is_browser_extension = true`: also read `skills/security-audit/references/browser-extension-checks.md`.

## Steps

1. **Security headers**: Search for middleware that sets security headers (helmet for Express, Django settings, Spring security config). Flag missing headers per the reference.

2. **CORS configuration**: Grep for CORS setup. Flag wildcards, origin reflection, credentials with broad origins.

3. **TLS/HTTPS**: Check for HTTPS redirects, certificate verification settings, TLS version configuration.

4. **Cookie security**: Search for cookie configuration. Flag missing `secure`, `httpOnly`, `sameSite` flags.

5. **Debug mode**: Check for debug flags in configuration files that might be active in production.

6. **Cloud config**: If cloud infrastructure files exist, check for public buckets, exposed ports, missing encryption.

For each finding, record: file, line, severity, description, CWE, remediation.
