# Authentication & Access Control Checks

Reference file for Phase 7 (Auth & Access Control). Covers JWT security, session management, RBAC, OAuth, and password handling.

---

## JWT (JSON Web Token) Security

### Critical

**No Signature Verification**
- Pattern: `jwt\.decode\(.*verify\s*[:=]\s*false|jwt\.decode\(.*(?:algorithms?\s*[:=]\s*\[\s*\]|options.*ignoreExpiration)`
- Pattern (JS): `jwt\.decode\(` without `jwt\.verify\(`
- Pattern (Python): `jwt\.decode\(.*options=\{.*"verify_signature":\s*False`
- Risk: Anyone can forge tokens
- Remediation: Always verify signatures with `jwt.verify()` using a strong secret/key

**Algorithm Confusion (none attack)**
- Pattern: `algorithms?\s*[:=]\s*\[.*['"]none['"]`
- Pattern: No algorithm whitelist in verification
- Risk: Attacker sets algorithm to "none", bypasses signature
- Remediation: Always specify allowed algorithms — `algorithms: ['RS256']`

**Symmetric Key with Public Key (RS/HS confusion)**
- Pattern: Using `HS256` with a public key that could be obtained by attacker
- Pattern: Switching between `RS256` and `HS256` without strict algorithm checking
- Risk: Attacker uses known public key as HMAC secret
- Remediation: Strictly enforce expected algorithm in verification

### High

**Weak JWT Secret**
- Pattern: `(?:jwt_secret|JWT_SECRET|secret_key)\s*[:=]\s*['"][^'"]{1,15}['"]`
- Pattern: Common weak secrets: `secret`, `password`, `key`, `changeme`, `your-256-bit-secret`
- Remediation: Use 256+ bit cryptographically random secret, or use asymmetric keys (RS256/ES256)

**Missing Expiration**
- Pattern: JWT payload without `exp` claim
- Pattern: `expiresIn` not set in `jwt.sign()` options
- Remediation: Set short expiration (15min for access tokens, hours/days for refresh)

**Token in URL**
- Pattern: `\?.*token=|&token=|[?&]jwt=|[?&]access_token=` in routes/links
- Risk: Token exposed in logs, referrer headers, browser history
- Remediation: Send tokens in Authorization header or HTTP-only cookies

**No Token Refresh/Rotation**
- Pattern: Long-lived access tokens without refresh token mechanism
- Remediation: Implement access/refresh token pattern with short-lived access tokens

### Medium

**Missing Audience/Issuer Validation**
- Pattern: `jwt\.verify\(` without `audience` or `issuer` options
- Remediation: Validate `iss` and `aud` claims

**Token in Local Storage**
- Pattern (JS): `localStorage\.setItem\(.*token|localStorage\[.*token`
- Risk: Vulnerable to XSS — any script can steal the token
- Remediation: Use HTTP-only cookies for token storage

---

## Session Management

### Critical

**No Session Regeneration on Login**
- Pattern: Login handler without `req\.session\.regenerate\(|session\.cycle\(|request\.session\.flush\(`
- Risk: Session fixation attack
- Remediation: Regenerate session ID after successful authentication

**Insecure Session Storage**
- Pattern (Express): `session\(.*store:.*MemoryStore|session\(\{` without explicit store
- Risk: Memory store leaks in production; not suitable for multi-instance
- Remediation: Use Redis, database, or other persistent session store

### High

**Missing Session Expiration**
- Pattern: Session config without `maxAge`, `expires`, or `cookie.maxAge`
- Pattern: Very long expiration (>24h for sensitive apps)
- Remediation: Set appropriate session timeout (30min–8h depending on risk)

**Insecure Cookie Flags**
- Pattern: `cookie:.*(?!.*secure)` (missing `secure: true`)
- Pattern: `cookie:.*(?!.*httpOnly)` (missing `httpOnly: true`)
- Pattern: `cookie:.*sameSite:\s*['"]?none['"]?` without `secure: true`
- Remediation: Set `secure: true`, `httpOnly: true`, `sameSite: 'strict'` or `'lax'`

**Session ID in URL**
- Pattern: `;jsessionid=|PHPSESSID.*GET|session_id.*[?&]`
- Risk: Session ID exposed in logs and referrer headers
- Remediation: Use cookies for session transport

### Medium

**Missing Idle Timeout**
- Pattern: Session without sliding expiration / idle timeout
- Remediation: Implement idle timeout (15-30min for sensitive apps)

**No Concurrent Session Control**
- Pattern: No mechanism to limit or track concurrent sessions per user
- Remediation: Implement session listing and revocation

---

## Password Security

### Critical

**Plaintext Password Storage**
- Pattern: `password\s*[:=]\s*req\.(body|params)\.password` stored directly in DB
- Pattern: No import/require of `bcrypt|argon2|scrypt|pbkdf2|passlib`
- Remediation: Hash with bcrypt (cost 12+), argon2id, or scrypt

**No Password on Sensitive Operations**
- Pattern: Account deletion, email change, password change without re-authentication
- Remediation: Require current password for sensitive operations

### High

**Weak Password Policy**
- Pattern: `minlength.*[0-5]|minLength.*[0-5]|MIN_PASSWORD_LENGTH.*[0-5]`
- Pattern: No complexity requirements (uppercase, number, special char)
- Remediation: Minimum 8 characters; check against breached password lists

**Weak Hashing**
- Pattern: `md5|sha1|sha256` used for password hashing (without key stretching)
- Pattern: bcrypt cost factor < 10
- Remediation: Use bcrypt (cost 12+), argon2id, or scrypt

### Medium

**Missing Password Breach Check**
- Pattern: No integration with Have I Been Pwned or similar
- Remediation: Check passwords against k-Anonymity API during registration

**Missing Account Lockout**
- Pattern: No failed login counter or lockout mechanism
- Remediation: Lock account after 5-10 failed attempts, progressive delay

---

## Role-Based Access Control (RBAC)

### Critical

**Missing Authorization Middleware**
- Pattern: Admin routes without role check middleware
- Pattern (Express): `app\.(get|post|put|delete)\(.*/admin` without `authorize|isAdmin|requireRole`
- Pattern (Django): Admin views without `@staff_member_required` or `@user_passes_test`
- Remediation: Apply authorization middleware to all admin/privileged routes

**Client-Side Authorization**
- Pattern: Role checks only in frontend code — `if\s*\(.*role.*===.*admin|v-if=.*isAdmin|{role === 'admin'`
- Risk: Authorization bypassed by modifying client code or calling API directly
- Remediation: Always enforce authorization server-side

### High

**Horizontal Privilege Escalation**
- Pattern: Resource access without ownership check — `findById\(req\.params\.id\)` without `where: { userId: req.user.id }`
- Remediation: Always include user ID/tenant ID in database queries

**Mass Assignment / Over-posting**
- Pattern (JS): `Object\.assign\(user, req\.body\)|\.update\(req\.body\)|\.create\(req\.body\)`
- Pattern (Ruby): `params\.permit!|params\[.*\]\.permit\(.*:role|:admin|:is_admin`
- Pattern (Python/Django): `form = Form\(request\.POST\)` with model including role/admin fields
- Remediation: Explicitly allowlist assignable fields; never pass raw request body to ORM

### Medium

**Missing Audit Trail**
- Pattern: Admin actions without logging
- Remediation: Log all role changes, permission grants, admin operations

**Role Hardcoded in Code**
- Pattern: `role === ['"]admin['"]|role == ['"]superuser['"]` scattered throughout codebase
- Remediation: Centralize role definitions; use permission-based checks over role-name checks

---

## OAuth Security

### Critical

**Missing State Parameter (CSRF)**
- Pattern: OAuth redirect without `state` parameter
- Pattern: `authorize\?.*client_id=.*(?!.*state=)`
- Remediation: Always generate and validate cryptographic `state` parameter

**Token in URL Fragment**
- Pattern: Using implicit grant flow (`response_type=token`)
- Risk: Token exposed in browser history, referrer
- Remediation: Use authorization code flow with PKCE

### High

**Missing PKCE**
- Pattern: Authorization code flow without `code_challenge` parameter
- Pattern: No `code_verifier` in token exchange
- Remediation: Implement PKCE (Proof Key for Code Exchange) for all public clients

**Open Redirect in OAuth Callback**
- Pattern: `redirect_uri` not validated against allowlist
- Pattern: Dynamic redirect URI from user input
- Remediation: Strictly validate redirect URI against registered values

**Insufficient Scope**
- Pattern: Requesting more OAuth scopes than needed
- Pattern: Not validating scopes on resource server
- Remediation: Request minimum necessary scopes; validate on each request

### Medium

**Missing Token Revocation**
- Pattern: No logout endpoint that revokes OAuth tokens
- Remediation: Implement token revocation on logout

**Long-Lived OAuth Tokens**
- Pattern: Access tokens without expiration or with long expiry
- Remediation: Short-lived access tokens + refresh token rotation

---

## Multi-Factor Authentication

### High

**No MFA Option**
- Pattern: Authentication flow without TOTP/WebAuthn/SMS MFA step
- Remediation: Implement MFA, at minimum TOTP (RFC 6238)

**MFA Bypass**
- Pattern: API endpoints that authenticate without MFA even when user has it enabled
- Pattern: "Remember this device" without proper device fingerprinting
- Remediation: Enforce MFA on all authentication paths

### Medium

**SMS-Only MFA**
- Pattern: MFA implementation using only SMS (no TOTP/WebAuthn option)
- Risk: SIM swapping, SS7 attacks
- Remediation: Offer TOTP or WebAuthn as alternatives

**Missing MFA on Sensitive Operations**
- Pattern: Password change, recovery email change, MFA disable without step-up auth
- Remediation: Require MFA verification for sensitive account changes

---

## API Authentication

### High

**No Rate Limiting on Auth Endpoints**
- Pattern: `/login|/auth|/token|/register` endpoints without rate limiting middleware
- Remediation: Implement rate limiting (e.g., 5 attempts per minute per IP)

**API Key in Query String**
- Pattern: `[?&]api_key=|[?&]apikey=|[?&]key=` in URL construction
- Risk: API key logged in access logs, cached by proxies
- Remediation: Send API keys in headers

**No API Key Rotation Mechanism**
- Pattern: No endpoint or mechanism for rotating API keys
- Remediation: Implement key rotation with grace period

### Medium

**Missing CSRF Protection**
- Pattern: POST/PUT/DELETE endpoints without CSRF token validation
- Pattern (Express): No `csurf` or `csrf` middleware
- Pattern (Django): `@csrf_exempt` decorator on state-changing views
- Remediation: Enable CSRF protection on all state-changing endpoints
