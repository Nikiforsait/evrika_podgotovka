# Logging & Monitoring Security Checks

Reference file for Phase 8 (Logging & Monitoring). Covers security event logging, log injection, PII in logs, and alerting requirements.

---

## Security Event Logging Requirements

### Critical Events (Must Be Logged)

| Event | Why | What to Log |
|---|---|---|
| Authentication success/failure | Detect brute force, credential stuffing | User ID, IP, timestamp, success/fail, failure reason |
| Authorization failures | Detect privilege escalation attempts | User ID, resource, action, IP, timestamp |
| Account lockout | Track lockout events and patterns | User ID, reason, duration, IP |
| Password changes | Detect unauthorized account changes | User ID, timestamp, method (reset/change) |
| MFA enable/disable | Critical account security change | User ID, timestamp, MFA method |
| Admin/privilege operations | Audit trail for privileged actions | Admin ID, action, target, timestamp |
| Token creation/revocation | Track active sessions and API keys | User/client ID, token type, timestamp |
| Data export/bulk access | Detect data exfiltration | User ID, data type, volume, timestamp |

### High-Priority Events (Should Be Logged)

| Event | Why | What to Log |
|---|---|---|
| Input validation failures | Detect injection attempts | IP, input type, validation rule, timestamp |
| Rate limit triggers | Detect DoS/abuse | IP, endpoint, limit type, timestamp |
| CORS violations | Detect cross-origin attacks | Origin, endpoint, timestamp |
| CSP violations | Detect XSS attempts | Violated directive, blocked URI, document URI |
| File upload/download | Track file operations | User ID, filename, size, type, timestamp |
| Configuration changes | Detect unauthorized config changes | User ID, setting, old/new value, timestamp |
| API key usage | Track third-party access | Key ID, endpoint, IP, timestamp |

---

## Checks for Missing Logging

### Pattern: Authentication Without Logging

**Express.js / Node.js**
```
# Login handler without logging
Pattern: (login|authenticate|signin)\s*.*\{[^}]*(?!log|logger|winston|pino|bunyan)
# Check: login routes should call a logging function
```

**Django / Python**
```
# Check for django.contrib.auth signals
Pattern: user_logged_in|user_logged_out|user_login_failed
# If not connected to signal handlers → missing auth logging
```

**Spring / Java**
```
# Check for AuthenticationEventPublisher or SecurityEventListener
Pattern: AuthenticationSuccessEvent|AuthenticationFailureBadCredentialsEvent
# If not handled → missing auth logging
```

### Pattern: Missing Error Logging

```
# Empty catch blocks
Pattern (JS/TS): catch\s*\([^)]*\)\s*\{\s*\}
Pattern (Java): catch\s*\([^)]*\)\s*\{\s*\}
Pattern (Python): except.*:\s*pass\s*$

# Catch blocks without logging
Pattern (JS): catch\s*\([^)]*\)\s*\{[^}]*(?!log|console|throw|reject|next\(err)
Pattern (Python): except.*:[^#]*(?!log|raise|print|logger)
```

### Pattern: Missing Request Logging

```
# No HTTP access logging middleware
Pattern (Express): No morgan|express-winston|pino-http middleware
Pattern (Django): No LOGGING config or middleware
Pattern (Spring): No access-log configuration
```

---

## Log Injection Prevention

### Critical

**Unsanitized User Input in Logs**
- Pattern (JS): `(log|logger)\.(info|warn|error|debug)\(.*\$\{.*req\.(body|query|params)`
- Pattern (Python): `(log|logger)\.(info|warning|error|debug)\(.*f['"].*request\.(args|form)|logging\.(info|warning|error)\(.*%s.*request`
- Pattern (Java): `(log|logger)\.(info|warn|error|debug)\(.*request\.getParameter`
- Risk: Log injection can forge log entries, corrupt log analysis, exploit log viewers (CRLF injection)
- Remediation: Sanitize user input before logging — strip newlines (`\n`, `\r`), use structured logging

### How to Detect

```
# Check if logging framework is configured for structured output
Pattern (JS): winston|pino|bunyan — these default to JSON (safer)
Pattern (Python): logging\.Formatter.*json|python-json-logger|structlog
Pattern (Java): logback.*json|JsonLayout|StructuredArguments

# If using plaintext logging → higher injection risk
Pattern: console\.log|print\(|System\.out\.println
```

### Remediation

- Use structured (JSON) logging — makes injection much harder
- Strip control characters from user input before logging
- Use parameterized logging: `logger.info("User login", { userId })` not template literals
- Validate log field lengths to prevent log flooding

---

## PII / Sensitive Data in Logs

### Critical

**Passwords in Logs**
- Pattern: `log.*password|log.*passwd|log.*pwd|logger.*password`
- Pattern: `console\.log\(.*password|print\(.*password`
- Remediation: Never log passwords; redact before logging

**Tokens/Keys in Logs**
- Pattern: `log.*(token|secret|key|credential|authorization|bearer)`
- Pattern: `console\.log\(.*token|print\(.*token`
- Remediation: Redact or mask sensitive fields

### High

**Email/Phone in Logs**
- Pattern: `log.*email|log.*phone|log.*mobile`
- Context: In verbose/debug log levels — acceptable at trace level with access controls
- Remediation: Mask PII — `j***@example.com`, `***-***-1234`

**Credit Card Numbers**
- Pattern: `log.*card|log.*credit|log.*payment.*number`
- Pattern: Logging request bodies that may contain payment data
- Remediation: Never log card numbers (PCI-DSS requirement)

**IP Addresses in Excessive Detail**
- Pattern: Logging full IP addresses with user actions beyond authentication
- Context: Auth events can include IP; general activity logs should anonymize
- Remediation: Truncate or hash IPs for non-security logs (GDPR)

### Medium

**Session IDs in Logs**
- Pattern: `log.*session_id|log.*sessionId|log.*sid`
- Risk: Session hijacking if logs are compromised
- Remediation: Log truncated session IDs — first 8 chars only

**Request Body Logging**
- Pattern: `log.*req\.body|log.*request\.body|log.*request\.POST`
- Risk: Bulk logging of request bodies may capture passwords, PII, payment data
- Remediation: Log only specific, non-sensitive fields; use allowlist

---

## Log Configuration Security

### High

**Logs Writable by Application User**
- Pattern: Log files with world-writable permissions
- Pattern: Log directory owned by application user (can delete audit trail)
- Remediation: Separate log storage; append-only permissions

**No Log Rotation**
- Pattern: No logrotate config, no `maxsize`/`maxFiles` in logging config
- Risk: Disk exhaustion DoS; old logs may contain stale secrets
- Remediation: Configure log rotation with retention policy

**Unencrypted Log Transport**
- Pattern: Syslog over UDP/TCP (not TLS)
- Pattern: Log shipping to HTTP (not HTTPS) endpoints
- Remediation: Use TLS for log transport; encrypt at rest

### Medium

**Missing Timestamps**
- Pattern: Log entries without ISO 8601 timestamps
- Remediation: Include UTC timestamps in all log entries

**Missing Correlation IDs**
- Pattern: No request ID / correlation ID in logs
- Remediation: Generate unique request ID per request; include in all log entries

**Insufficient Retention**
- Check: Log retention < 90 days (SOC 2 typically requires 1 year)
- Remediation: Configure retention per compliance requirements

---

## Alerting Requirements

### What to Alert On

| Trigger | Threshold Example | Severity |
|---|---|---|
| Multiple auth failures from one IP | >10 in 5 minutes | High |
| Successful login after multiple failures | Any after >5 failures | High |
| Admin account login from new IP | Any new IP | Medium |
| Account lockout spike | >5 lockouts in 1 minute | High |
| Privilege escalation | Any unauthorized role change | Critical |
| Large data export | >1000 records in single request | High |
| CSP violation spike | >50 in 5 minutes | Medium |
| 5xx error spike | >10% of requests | Medium |
| Rate limit exhaustion | Any user hitting limit repeatedly | Medium |

### Check for Alerting Configuration

```
# Check for alerting/monitoring integration
Pattern: datadog|newrelic|sentry|pagerduty|opsgenie|alertmanager|cloudwatch.*alarm
Pattern: @sentry|Sentry\.init|DD_|NEW_RELIC_
# If none found → flag missing monitoring integration
```

---

## Remediation Guidance

### Auto-fixable (Low/Medium)

1. **Add request ID middleware** — inject correlation ID header
2. **Configure structured logging** — switch from console.log to structured logger
3. **Add log level configuration** — ensure DEBUG is not on in production

### Requires Confirmation (High)

1. **Add security event logging** — instrument auth, admin, and data access events
2. **Sanitize logged input** — add log sanitization middleware
3. **Redact PII from logs** — add redaction filters to logging pipeline

### Manual Only

1. **Set up alerting** — requires external monitoring platform
2. **Configure log retention** — depends on compliance requirements
3. **Implement tamper-evident logging** — requires infrastructure changes
