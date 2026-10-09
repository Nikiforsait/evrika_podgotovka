# OWASP Top 10 — SAST Check Patterns

Reference file for Phase 4 (Code-Level SAST). Contains grep-able patterns, descriptions, and remediation guidance for each OWASP Top 10 category.

---

## A01:2021 — Broken Access Control (CWE-284, CWE-285, CWE-639)

### Checks

**Insecure Direct Object Reference (IDOR)**
- Pattern (JS/TS): `req\.(params|query|body)\.\w+` used directly in database queries without authorization check
- Pattern (Python): `request\.(args|form|json)\[` used directly in ORM queries
- Pattern (Java): `request\.getParameter\(` followed by direct DB query
- Look for: route handlers that fetch resources by ID without checking ownership

**Missing Function-Level Access Control**
- Pattern: Route/endpoint definitions without middleware or decorators for auth
- JS/Express: `app\.(get|post|put|delete|patch)\(.*(?!auth|protect|guard|middleware)`
- Python/Flask: `@app\.route\(` without `@login_required` or `@requires_auth`
- Python/Django: views without `@permission_required` or `LoginRequiredMixin`
- Java/Spring: `@RequestMapping` without `@PreAuthorize` or `@Secured`

**Path Traversal**
- Pattern: `\.\./` or `\.\.\\` in file path construction
- Pattern (JS): `path\.join\(.*req\.(params|query|body)`
- Pattern (Python): `os\.path\.join\(.*request\.`
- Pattern (Java): `new File\(.*request\.getParameter`
- Pattern: `readFile|readFileSync|open\(` with user-controlled input

**CORS Misconfiguration**
- Pattern: `Access-Control-Allow-Origin.*\*`
- Pattern: `cors\(\{.*origin:\s*(true|\*|['"].\*['"])`
- Pattern: Reflecting `Origin` header without validation

### Remediation
- Implement authorization middleware on all routes
- Use allowlists for CORS origins
- Validate resource ownership before returning data
- Use `path.resolve()` and check that resolved path is within allowed directory

---

## A02:2021 — Cryptographic Failures (CWE-259, CWE-327, CWE-331)

### Checks

**Weak Hashing Algorithms**
- Pattern: `md5|MD5|sha1|SHA1` in crypto contexts (not checksums)
- Pattern (JS): `crypto\.createHash\(['"](?:md5|sha1)['"]\)`
- Pattern (Python): `hashlib\.(md5|sha1)\(`
- Pattern (Java): `MessageDigest\.getInstance\(['"](?:MD5|SHA-1)['"]\)`

**Weak Encryption**
- Pattern: `DES|RC4|RC2|Blowfish|ECB` in encryption contexts
- Pattern: `createCipher\(` (deprecated, use `createCipheriv`)
- Pattern (Java): `Cipher\.getInstance\(["'].*ECB`

**Hardcoded Cryptographic Keys**
- Pattern: `(key|secret|iv|nonce)\s*=\s*['"][A-Za-z0-9+/=]{16,}['"]`
- Pattern: `Buffer\.from\(['"][A-Za-z0-9+/=]+['"]\)`

**Insufficient TLS**
- Pattern: `rejectUnauthorized\s*:\s*false`
- Pattern: `verify\s*=\s*False` (Python requests)
- Pattern: `CURLOPT_SSL_VERIFYPEER.*false|0`
- Pattern: `InsecureSkipVerify:\s*true` (Go)

**Plaintext Storage of Sensitive Data**
- Pattern: passwords stored without hashing
- Pattern: `password\s*=\s*` in config/env files without reference to hash/bcrypt

### Remediation
- Use SHA-256+ for hashing, bcrypt/scrypt/argon2 for passwords
- Use AES-256-GCM for encryption
- Store keys in environment variables or secret managers
- Always verify TLS certificates

---

## A03:2021 — Injection (CWE-79, CWE-89, CWE-78)

### Checks

**SQL Injection**
- Pattern (JS): `query\(\s*['"\`].*\$\{|query\(\s*['"].*\+\s*`
- Pattern (Python): `execute\(\s*f['"]|execute\(\s*['"].*%\s|execute\(\s*['"].*\.format\(`
- Pattern (Java): `Statement.*execute.*\+.*request|createQuery\(.*\+`
- Pattern (Ruby): `where\(["'].*#\{|find_by_sql\(.*#\{`
- Pattern (PHP): `mysql_query\(.*\$_|mysqli_query\(.*\$_`
- Pattern: String concatenation in any `SELECT|INSERT|UPDATE|DELETE|DROP` statement with user input

**NoSQL Injection**
- Pattern: `\$where|\$regex|\$ne|\$gt|\$lt` with user input
- Pattern (JS): `find\(\{.*req\.(body|query|params)`
- Pattern (Python): `find\(\{.*request\.(args|form|json)`

**Command Injection**
- Pattern (JS): `exec\(.*req\.|exec\(.*\$\{|child_process`
- Pattern (Python): `os\.system\(.*request|subprocess\.(call|run|Popen)\(.*request|subprocess\.(call|run|Popen)\(.*shell=True`
- Pattern (Java): `Runtime\.getRuntime\(\)\.exec\(.*request`
- Pattern (Ruby): `system\(.*params|` + backtick with user input
- Pattern (PHP): `exec\(.*\$_|system\(.*\$_|passthru\(.*\$_|shell_exec\(.*\$_`

**XSS (Cross-Site Scripting)**
- Pattern (JS): `\.innerHTML\s*=|\.outerHTML\s*=|document\.write\(`
- Pattern (React): `dangerouslySetInnerHTML`
- Pattern (Angular): `bypassSecurityTrust|innerHTML\s*\]`
- Pattern (Vue): `v-html`
- Pattern (template): `\{\{.*\|.*safe\}\}|\{!!.*!!\}` (Django/Laravel unescaped)
- Pattern (EJS): `<%-` (unescaped output)

**LDAP Injection**
- Pattern: `ldap_search\(.*\$_|search_s\(.*request`

**XPath Injection**
- Pattern: `xpath\(.*\$_|evaluate\(.*request`

### Remediation
- Use parameterized queries / prepared statements for SQL
- Use `execFile` instead of `exec`, avoid `shell=True`
- Sanitize/encode output for XSS; use framework auto-escaping
- Use allowlist input validation

---

## A04:2021 — Insecure Design (CWE-209, CWE-256, CWE-501)

### Checks

**Verbose Error Messages**
- Pattern: `stack|stackTrace|traceback` exposed to client
- Pattern (JS): `res\.(send|json)\(.*err\.(message|stack)`
- Pattern (Python): `DEBUG\s*=\s*True` in production settings
- Pattern: `app\.use\(.*errorHandler.*\{.*stack`

**Missing Rate Limiting** (High for auth endpoints, Medium for general)
- Check: Auth endpoints without rate limiting middleware
- Pattern (Express): login/register routes without `rateLimit|slowDown|brute`
- Pattern (Django): login views without `@ratelimit`

**Missing Input Validation**
- Pattern: Request body used directly without schema validation
- Pattern (JS): no `joi|yup|zod|ajv|express-validator` imports near route handlers
- Pattern (Python): no `pydantic|marshmallow|wtforms|cerberus` validation

### Remediation
- Return generic error messages to clients; log detailed errors server-side
- Implement rate limiting on auth and sensitive endpoints
- Validate all input with schema libraries

---

## A05:2021 — Security Misconfiguration (CWE-16, CWE-611)

### Checks

**Debug Mode in Production**
- Pattern: `DEBUG\s*=\s*True|NODE_ENV.*development|debug:\s*true`
- Pattern: `app\.debug\s*=\s*True`
- Pattern: Stack traces visible in HTTP responses

**XML External Entities (XXE)**
- Pattern (Java): `XMLInputFactory|DocumentBuilderFactory|SAXParserFactory` without disabling external entities
- Pattern (Python): `etree\.parse|xml\.dom\.minidom\.parse` without defusing
- Pattern (PHP): `simplexml_load|DOMDocument` without `libxml_disable_entity_loader`

**Default Credentials**
- Pattern: `admin:admin|root:root|admin:password|test:test|default:default`
- Pattern: `password\s*[:=]\s*['"](?:password|admin|123456|test|default)['"]`

**Unnecessary Features Enabled**
- Pattern: `TRACE|OPTIONS` methods enabled unnecessarily
- Pattern: Directory listing enabled
- Pattern: Unnecessary ports exposed in Docker

### Remediation
- Disable debug mode in production
- Disable XML external entity processing
- Remove default credentials
- Disable unnecessary HTTP methods and features

---

## A06:2021 — Vulnerable and Outdated Components (CWE-1035)

### Checks
- Handled primarily in Phase 3 (Dependency & Supply Chain audit)
- Additionally check for:
  - Pattern: Vendored/copied library files with version comments
  - Pattern: CDN links with specific outdated versions
  - Pattern: `<script src=.*(?:jquery-1|angular\.1\.[0-5]|bootstrap-[23]|react\.0\.)`

### Remediation
- Update dependencies regularly
- Use lockfiles and audit tools
- Subscribe to security advisories

---

## A07:2021 — Identification and Authentication Failures (CWE-287, CWE-384)

### Checks
- Handled primarily in Phase 7 (Auth & Access Control audit)
- Additionally check for:
  - Pattern: `password.*minlength.*[0-5]|passwordMinLength\s*[:=]\s*[0-5]`
  - Pattern: Missing account lockout after failed attempts
  - Pattern: Session IDs in URLs

### Remediation
- Enforce strong password policies
- Implement account lockout / progressive delays
- Use secure session management

---

## A08:2021 — Software and Data Integrity Failures (CWE-502, CWE-829)

### Checks

**Unsafe Deserialization**
- Pattern (Java): `ObjectInputStream|readObject\(\)|XMLDecoder|Yaml\.load\(`
- Pattern (Python): `pickle\.load|yaml\.load\(.*(?!Loader=SafeLoader)|marshal\.load|shelve\.open`
- Pattern (PHP): `unserialize\(\$_|unserialize\(.*\$`
- Pattern (Ruby): `Marshal\.load|YAML\.load\(`
- Pattern (JS): `serialize-javascript|node-serialize|cryo`

**Missing Subresource Integrity**
- Pattern: `<script src=.*https?://` without `integrity=` attribute
- Pattern: `<link.*href=.*https?://` without `integrity=` attribute (for CSS)

### Remediation
- Use safe deserialization methods (e.g., `yaml.safe_load`, JSON instead of pickle)
- Add SRI hashes to external script/stylesheet tags
- Verify package signatures

---

## A09:2021 — Security Logging and Monitoring Failures (CWE-778)

### Checks
- Handled primarily in Phase 8 (Logging & Monitoring audit)
- Additionally check for:
  - Pattern: Authentication events without logging
  - Pattern: Admin actions without audit trail

### Remediation
- Log all authentication, authorization, and admin events
- Implement tamper-evident logging
- Set up alerting for security events

---

## A10:2021 — Server-Side Request Forgery (CWE-918)

### Checks

**SSRF**
- Pattern (JS): `axios\(.*req\.|fetch\(.*req\.|http\.get\(.*req\.|request\(.*req\.`
- Pattern (Python): `requests\.(get|post|put)\(.*request\.|urllib\.request\.urlopen\(.*request\.`
- Pattern (Java): `URL\(.*request\.getParameter|HttpClient.*request\.getParameter`
- Pattern (Go): `http\.Get\(.*r\.FormValue`
- Pattern: Any HTTP client call where the URL comes from user input

**DNS Rebinding**
- Pattern: URL validation only at request time without re-validation at connection time

### Remediation
- Validate and allowlist URLs server-side
- Block requests to internal/private IP ranges (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x)
- Use network-level controls (firewall rules for outbound requests)
- Disable HTTP redirects or re-validate after redirect

---

## Language-Specific Patterns

### JavaScript/TypeScript
- `eval\(` — code injection
- `new Function\(` — code injection
- `setTimeout\(.*req\.|setInterval\(.*req\.` — code injection
- `\.call\(.*req\.|\.apply\(.*req\.` — prototype pollution
- `Object\.assign\(\{\}.*req\.body` — prototype pollution
- `__proto__|constructor\.prototype` — prototype pollution

### Python
- `eval\(|exec\(` — code injection
- `__import__\(` — dynamic import injection
- `globals\(\)|locals\(\)` — scope manipulation
- `setattr\(.*request|getattr\(.*request` — attribute injection

### Java
- `ScriptEngine.*eval\(` — code injection
- `Expression\.evaluate\(` — expression language injection
- `Class\.forName\(.*request` — reflection injection
- `\.getMethod\(.*request` — reflection injection

### PHP
- `eval\(|assert\(|preg_replace.*e` — code injection
- `include\(.*\$_|require\(.*\$_` — file inclusion
- `extract\(\$_` — variable injection
- `$$` — variable variables with user input

### Ruby
- `eval\(.*params|send\(.*params|public_send\(.*params` — code injection
- `constantize|safe_constantize` with user input — class injection
- `render\s+inline:` — template injection

### Go
- `template\.HTML\(` — XSS (bypasses auto-escaping)
- `fmt\.Sprintf.*SELECT|fmt\.Sprintf.*INSERT` — SQL injection
- `http\.ListenAndServe\(":` without TLS — cleartext transport
