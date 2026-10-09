# Phase 8 — Logging & Monitoring

**Goal:** Verify security event logging, detect log injection risks, and check for PII in logs.

**Reference:** Read `skills/security-audit/references/logging-monitoring-checks.md` for detailed patterns.

## Steps

1. **Security event logging**: Check if critical events are logged:
   - Authentication success/failure
   - Authorization failures
   - Admin operations
   - Data access/export

2. **Log injection**: Check for unsanitized user input in log statements. Check if structured (JSON) logging is used.

3. **PII in logs**: Search for logging statements that include passwords, tokens, emails, credit card numbers, or session IDs.

4. **Log configuration**:
   - Check for log rotation configuration
   - Check log transport security (TLS)
   - Check for correlation IDs in requests

5. **Monitoring**: Check for integration with monitoring/alerting platforms (Sentry, Datadog, New Relic, etc.).
