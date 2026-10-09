# False Positive Registry

Centralized rules for filtering false positives across all audit phases. Load this reference before evaluating any finding to reduce noise.

---

## Global Exclusion Rules

### File Path Exclusions

Never flag findings in these paths (unless the finding is a real secret or credential):

```
# Test files
**/test/**
**/tests/**
**/__tests__/**
**/*.test.*
**/*.spec.*
**/*_test.*
**/*_spec.*
**/test_*
**/spec_*
**/testing/**
**/cypress/**
**/e2e/**
**/playwright/**

# Fixtures and mocks
**/fixtures/**
**/fixture/**
**/__fixtures__/**
**/mocks/**
**/mock/**
**/__mocks__/**
**/stubs/**
**/fakes/**
**/factories/**
**/seeds/**

# Generated / vendored (read-only, not authored by project)
**/node_modules/**
**/vendor/**
**/.venv/**
**/venv/**
**/dist/**
**/build/**
**/out/**
**/.next/**
**/.nuxt/**
**/target/**
**/bin/**
**/obj/**
**/__pycache__/**
**/coverage/**
**/.nyc_output/**

# Documentation
**/docs/**
**/documentation/**
**/*.md (EXCEPT .env.example, config examples)
**/*.rst
**/*.txt (EXCEPT requirements.txt)

# Lock files (patterns in lock files are not authored code)
package-lock.json
yarn.lock
pnpm-lock.yaml
Pipfile.lock
poetry.lock
Gemfile.lock
composer.lock
go.sum
Cargo.lock

# IDE and editor
**/.vscode/**
**/.idea/**
**/.vs/**
**/*.swp
**/*.swo
```

### Exception: ALWAYS scan these even in excluded paths

- `**/test*/**/.env` — real secrets sometimes leak into test configs
- `**/fixtures/**/credentials*` — real credentials sometimes end up in fixtures
- `**/*.pem` / `**/*.key` — private keys are ALWAYS a finding regardless of location

---

## Content Exclusions

### Placeholder / Example Values

Do NOT flag strings that match these patterns — they are clearly placeholder values:

```
# Explicit placeholders
your[-_]?api[-_]?key
your[-_]?secret
your[-_]?password
your[-_]?token
REPLACE[-_]?ME
CHANGE[-_]?ME
INSERT[-_]?HERE
TODO
FIXME
XXX+
xxx+
placeholder
example[-_.]?com
example[-_.]?org
test[-_.]?com
foo[-_]?bar
lorem[-_]?ipsum
sample[-_]?key
dummy[-_]?value
fake[-_]?secret

# Empty / null assignments
= ""
= ''
= null
= None
= nil
= undefined
= ""
= ''
= ENV[
= os\.environ
= process\.env
= System\.getenv
```

### Common Safe Patterns

Do NOT flag:

```
# Public keys (not secrets)
-----BEGIN PUBLIC KEY-----
-----BEGIN CERTIFICATE-----
-----BEGIN SSH2 PUBLIC KEY-----
ssh-rsa AAAA
ssh-ed25519 AAAA
ecdsa-sha2-nistp

# Hash references (not secrets)
sha256:[a-f0-9]{64}
sha512:[a-f0-9]{128}
md5:[a-f0-9]{32}    # When used as checksum, not password hash

# Git SHAs
[a-f0-9]{40} in git context (commit messages, lockfiles)

# Version strings that look like keys
v[0-9]+\.[0-9]+\.[0-9]+
[0-9]+\.[0-9]+\.[0-9]+-[a-z]+

# UUIDs (not secrets)
[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}

# Base64-encoded small values (< 16 chars decoded = likely not a secret)
# Only flag base64 strings that decode to 16+ bytes
```

---

## Phase-Specific False Positive Rules

### Phase 2 — Configuration & Hardening

**CORS wildcard — not a finding when:**
- Application is a public API with no authentication (e.g., open data API)
- `Access-Control-Allow-Credentials` is NOT set (wildcard without credentials is safe)
- CORS is in a development-only config file

**Debug mode — not a finding when:**
- `DEBUG = True` is in a file named `settings/development.py` or `config.dev.js`
- The value is read from an environment variable: `DEBUG = os.environ.get('DEBUG', False)`

**Missing security headers — not a finding when:**
- The project is a CLI tool, library, or package (not a web server)
- Headers are set at the reverse proxy / CDN level (check for nginx/Apache/Cloudflare config)

### Phase 3 — Dependencies

**Vulnerable dependency — reduce severity when:**
- The vulnerability is in a devDependency (not shipped to production)
- The vulnerable code path is not reachable (e.g., a parsing vulnerability in a library used only for output)

**Unpinned version — not a finding when:**
- The file is a library's `package.json` (libraries should use ranges for peer compatibility)
- Lockfile exists and is committed (lockfile pins the actual version)

### Phase 4 — SAST

**SQL injection — not a finding when:**
- The concatenated value is a constant, not user input: `"SELECT * FROM " + TABLE_NAME`
- An ORM is used with proper escaping: `Model.findOne({ where: { id } })`
- The query uses tagged template literals with a safe driver: `` sql`SELECT * FROM users WHERE id = ${id}` ``

**XSS — not a finding when:**
- `dangerouslySetInnerHTML` is used with DOMPurify or similar sanitizer on the same line/block
- `v-html` is used with a sanitized computed property
- `innerHTML` is assigned a constant string, not user input

**Command injection — not a finding when:**
- `exec`/`spawn` uses a hardcoded command with no user input anywhere in the arguments
- `shell=True` is used with a fully hardcoded command string (no variables)

**eval() — not a finding when:**
- In a build tool config (webpack, babel, jest config)
- In a REPL or debug utility explicitly gated behind `NODE_ENV === 'development'`
- `JSON.parse()` is used (not `eval`)

### Phase 5 — IaC

**Docker running as root — not a finding when:**
- Multi-stage build: root is used in build stage, non-root in final stage
- Init container that requires root for setup, followed by `USER` switch

**Kubernetes privileged — not a finding when:**
- It's a DaemonSet for node-level operations (e.g., log collector, CNI plugin)
- `securityContext` is set at the pod level (not container level) — check both

**Unpinned GitHub Action — reduce severity when:**
- The action is from `actions/` org (official GitHub actions) using major version tag `@v4`
- The action is from a trusted org using semver tags

### Phase 6 — Secrets

**JWT token in code — not a finding when:**
- It's in a test file and the JWT is expired or uses a test-only secret
- It's in documentation showing JWT format
- The decoded payload contains `"sub": "test"` or `"exp"` in the past

**Generic password pattern — not a finding when:**
- It's a password validation rule: `minLength: 8` (describing policy, not a password)
- It's a password field name in a form/schema definition
- It's a bcrypt/argon2 hash (starts with `$2b$`, `$argon2`)

**Database connection string — not a finding when:**
- Points to `localhost`/`127.0.0.1` in a development config
- Password is an environment variable reference: `postgres://${DB_USER}:${DB_PASS}@`

### Phase 7 — Auth

**Missing auth middleware — not a finding when:**
- Route is explicitly public: `/health`, `/status`, `/metrics`, `/public/*`, `/api/docs`
- Route is an authentication endpoint itself: `/login`, `/register`, `/forgot-password`
- Route is a webhook receiver that uses signature verification instead of auth middleware

**Missing rate limiting — reduce severity when:**
- Rate limiting is handled at the infrastructure level (nginx, API gateway, Cloudflare)
- Check for `nginx.conf`, `kong.yml`, `api-gateway` config files

### Phase 8 — Logging

**PII in logs — not a finding when:**
- The log level is `debug` or `trace` AND there's a log level check guarding it
- The value is hashed/masked before logging: `email.replace(/(?<=.).(?=.*@)/g, '*')`
- It's in a security audit log (auth events SHOULD include user identifiers)

**Empty catch block — not a finding when:**
- The catch block has a comment explaining why it's intentionally empty
- It's in cleanup/teardown code where failure is acceptable: `try { fs.unlinkSync(tmp); } catch {}`

---

## Verification Checklist

Before finalizing any finding, verify:

1. **Is the file in an excluded path?** → Check global exclusions above
2. **Is the value a placeholder?** → Check content exclusions above
3. **Is there a phase-specific exception?** → Check phase rules above
4. **Is the match in a comment?** → Read the actual line — if it starts with `//`, `#`, `/*`, `*`, `--`, or `"""`, it's a comment (reduce to Info severity)
5. **Is the match in a string that's documenting the pattern?** → If the file is a security check/rule definition, it's describing the vulnerability, not exhibiting it
6. **Read 5-10 lines of context** → Many false positives are resolved by seeing the surrounding code (e.g., input is sanitized on the previous line)

---

## Severity Adjustments for Context

| Context | Adjustment |
|---|---|
| Finding is in test/fixture code | Reduce by 2 levels (min: Info) |
| Finding is in commented code | Reduce to Info |
| Finding is in development-only config | Reduce by 1 level |
| Finding is in a devDependency | Reduce by 1 level |
| Finding has compensating control nearby | Reduce by 1 level |
| Finding is in internal-only (non-public) code | Reduce by 1 level |
| Finding chains with another finding | Increase by 1 level |
| Finding is in authentication/payment path | Increase by 1 level |
