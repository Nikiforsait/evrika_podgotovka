# Configuration & Hardening Checks

Reference file for Phase 2 (Configuration & Hardening). Covers TLS, CORS, security headers, cookie security, debug modes, and cloud misconfigurations.

---

## Security Headers

### Critical

**Missing Content-Security-Policy (CSP)**
- Check: No `Content-Security-Policy` header set
- Pattern: No `helmet` (Node.js), `django-csp` (Django), or equivalent middleware
- Risk: XSS attacks can load arbitrary scripts
- Remediation: Set CSP with restrictive `default-src`, avoid `unsafe-inline` and `unsafe-eval`
- Auto-fix: Add CSP middleware with sensible defaults

**Missing Strict-Transport-Security (HSTS)**
- Check: No `Strict-Transport-Security` header
- Risk: Downgrade attacks from HTTPS to HTTP
- Remediation: Set `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- Auto-fix: Add HSTS header middleware

### High

**Missing X-Content-Type-Options**
- Check: No `X-Content-Type-Options: nosniff` header
- Risk: MIME-type sniffing can execute uploaded files as scripts
- Remediation: Set `X-Content-Type-Options: nosniff`
- Auto-fix: Add header

**Missing X-Frame-Options**
- Check: No `X-Frame-Options` header (or CSP `frame-ancestors`)
- Risk: Clickjacking attacks
- Remediation: Set `X-Frame-Options: DENY` or `SAMEORIGIN`
- Auto-fix: Add header

**Missing Referrer-Policy**
- Check: No `Referrer-Policy` header
- Risk: Sensitive URL parameters leaked via Referer header
- Remediation: Set `Referrer-Policy: strict-origin-when-cross-origin` or `no-referrer`
- Auto-fix: Add header

### Medium

**Missing Permissions-Policy**
- Check: No `Permissions-Policy` (formerly `Feature-Policy`) header
- Risk: Third-party scripts can access camera, microphone, geolocation
- Remediation: Set restrictive `Permissions-Policy`
- Auto-fix: Add header with sensible defaults

**Missing X-XSS-Protection**
- Check: No `X-XSS-Protection` header (legacy browsers)
- Remediation: Set `X-XSS-Protection: 0` (disable; rely on CSP instead)
- Note: Modern approach is to disable this and use CSP; the built-in XSS filter can introduce vulnerabilities

### Framework-Specific Header Checks

**Express.js**
```
# Check for helmet middleware
Pattern: require\(['"]helmet['"]\)|import.*from\s+['"]helmet['"]
# If missing → recommend: app.use(helmet())
```

**Django**
```
# Check SECURE_ settings in settings.py
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_SSL_REDIRECT = True
X_FRAME_OPTIONS = 'DENY'
```

**Spring Boot**
```
# Check for security headers config
Pattern: .headers().defaultsDisabled()|.headers().disable()
# Should use: .headers().contentSecurityPolicy("...")
```

**ASP.NET**
```
# Check for UseHsts, UseHttpsRedirection
Pattern: app\.UseHsts\(\)|app\.UseHttpsRedirection\(\)
```

---

## CORS (Cross-Origin Resource Sharing)

### Critical

**Wildcard Origin**
- Pattern: `Access-Control-Allow-Origin:\s*\*` (with credentials)
- Pattern: `cors\(\{.*origin:\s*true` (reflects any origin)
- Pattern: `cors\(\{.*origin:\s*\*`
- Risk: Any website can make authenticated cross-origin requests
- Remediation: Specify exact allowed origins

**Origin Reflection**
- Pattern: Setting `Access-Control-Allow-Origin` to the value of the request's `Origin` header without validation
- Pattern: `res\.setHeader\(['"]Access-Control-Allow-Origin['"],\s*req\.headers\.origin\)`
- Risk: Any origin is implicitly trusted
- Remediation: Validate origin against allowlist before reflecting

### High

**Credentials with Permissive Origin**
- Pattern: `Access-Control-Allow-Credentials:\s*true` with broad origin
- Risk: Cross-origin requests can include cookies/auth
- Remediation: Use strict origin allowlist when credentials are enabled

**Permissive Methods**
- Pattern: `Access-Control-Allow-Methods:.*\*|Access-Control-Allow-Methods:.*PUT.*DELETE`
- Remediation: Only allow necessary HTTP methods

### Medium

**Excessive Max-Age**
- Pattern: `Access-Control-Max-Age:\s*[0-9]{6,}` (>100,000 seconds)
- Risk: Browsers cache preflight for too long; can't quickly revoke CORS permissions
- Remediation: Set max-age to 3600 (1 hour) or less

---

## TLS / HTTPS Configuration

### Critical

**No HTTPS Redirect**
- Pattern: HTTP server without redirect to HTTPS
- Pattern (Express): `http\.createServer\(` without corresponding HTTPS or redirect
- Pattern (Django): `SECURE_SSL_REDIRECT\s*=\s*False`
- Remediation: Redirect all HTTP to HTTPS

**Disabled Certificate Verification**
- Pattern (Node): `rejectUnauthorized\s*:\s*false`
- Pattern (Python): `verify\s*=\s*False`
- Pattern (Go): `InsecureSkipVerify:\s*true`
- Pattern (Java): `TrustAllCerts|X509TrustManager.*return|checkServerTrusted.*return`
- Pattern: `NODE_TLS_REJECT_UNAUTHORIZED.*0`
- Remediation: Always verify TLS certificates; use proper CA bundles

### High

**Weak TLS Version**
- Pattern: `TLSv1[^.]|TLSv1\.0|TLSv1\.1|SSLv3|SSLv2`
- Pattern: `minVersion.*TLSv1[^.2-3]|ssl_version.*TLSv1[^.2-3]`
- Remediation: Minimum TLS 1.2; prefer TLS 1.3

**Weak Cipher Suites**
- Pattern: `RC4|DES|3DES|MD5|NULL|EXPORT|anon` in cipher configuration
- Remediation: Use modern cipher suites (AEAD ciphers: AES-GCM, ChaCha20-Poly1305)

### Medium

**Missing HSTS Preload**
- Pattern: HSTS header without `preload` directive
- Remediation: Add `preload` and submit to HSTS preload list

---

## Cookie Security

### High

**Missing Secure Flag**
- Pattern: `Set-Cookie:.*(?!.*Secure)|cookie\(.*(?!.*secure:\s*true)`
- Pattern (Express): `cookie:.*(?!.*secure)`
- Remediation: Set `Secure` flag on all cookies (transmit only over HTTPS)
- Auto-fix: Add `secure: true` to cookie configuration

**Missing HttpOnly Flag**
- Pattern: Session/auth cookies without `HttpOnly`
- Pattern (Express): `cookie:.*(?!.*httpOnly)`
- Remediation: Set `HttpOnly` flag on session/auth cookies (prevents JS access)
- Auto-fix: Add `httpOnly: true` to cookie configuration

**Missing SameSite Attribute**
- Pattern: Cookies without `SameSite` attribute
- Remediation: Set `SameSite=Strict` or `SameSite=Lax`
- Auto-fix: Add `sameSite: 'lax'` to cookie configuration

### Medium

**Excessive Cookie Scope**
- Pattern: `Domain=\.` (leading dot = all subdomains)
- Pattern: `Path=/` on non-session cookies
- Remediation: Scope cookies to the narrowest domain and path

**Long Cookie Expiration**
- Pattern: Session cookies with expiry > 24 hours
- Remediation: Appropriate expiry based on sensitivity

---

## Debug & Development Mode

### Critical

**Debug Mode in Production**
- Pattern (Django): `DEBUG\s*=\s*True` in settings.py or production config
- Pattern (Flask): `app\.debug\s*=\s*True|app\.run\(.*debug=True`
- Pattern (Node): `NODE_ENV.*development` in production config
- Pattern (Rails): `config\.consider_all_requests_local\s*=\s*true` in production
- Pattern (Spring): `spring\.profiles\.active.*dev` in production
- Risk: Detailed error pages, stack traces, debug endpoints exposed
- Remediation: Ensure debug mode is OFF in production

**Debug Endpoints Exposed**
- Pattern: `/__debug__|/debug/|/actuator|/_profiler|/elmah\.axd|/trace`
- Pattern: `app\.use.*morgan.*dev` without environment check
- Remediation: Disable or restrict debug endpoints in production

### High

**Verbose Error Responses**
- Pattern: Error handlers that return stack traces
- Pattern (Express): `res\.(send|json)\(.*err\.(stack|message)\)`
- Pattern: `traceback\.format_exc\(\)` in HTTP responses
- Remediation: Return generic errors to client; log details server-side

**Source Maps in Production**
- Pattern: `.map` files served in production
- Pattern: `devtool:.*source-map` (not hidden) in webpack production config
- Remediation: Use `hidden-source-map` or disable in production

### Medium

**Console Logging in Production**
- Pattern: `console\.log\(.*password|console\.log\(.*token|console\.log\(.*secret`
- Risk: Sensitive data logged to client console
- Remediation: Remove or guard console.log statements; use proper logging library

**Development Dependencies in Production**
- Pattern: Dev-only packages in production `dependencies` (not `devDependencies`)
- Example: `nodemon`, `webpack-dev-server`, `react-devtools` in production bundle
- Remediation: Move to `devDependencies`

---

## Cloud Configuration Misconfigs

### Critical

**Public S3 Buckets**
- Pattern: `"PublicRead"|"PublicReadWrite"|"public-read"|"public-read-write"` in bucket ACL
- Pattern: `block_public_acls\s*=\s*false|block_public_policy\s*=\s*false`
- Remediation: Enable S3 Block Public Access at account level

**Exposed Database Ports**
- Pattern: Security group / firewall rules allowing `0.0.0.0/0` on ports 5432, 3306, 27017, 6379
- Remediation: Restrict to VPC/private subnets only

### High

**Missing Encryption at Rest**
- Pattern: Storage resources without encryption configuration
- Remediation: Enable encryption on all storage (S3, EBS, RDS, etc.)

**Overly Permissive IAM**
- Pattern: `"Action": "*"` or `"Resource": "*"` in IAM policies
- Remediation: Apply principle of least privilege

### Medium

**Missing Access Logging**
- Pattern: S3 buckets, ALBs, CloudFront without access logging enabled
- Remediation: Enable access logging and ship to centralized log store

**Default Security Groups**
- Pattern: Using default VPC security groups
- Remediation: Create custom security groups with explicit rules
