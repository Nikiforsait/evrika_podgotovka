# Auto-Remediation Patterns

Reference file for Phase 9b (Auto-Remediation). Contains exact before/after code transforms for each auto-fixable finding, organized by language and framework.

---

## Safety Guardrails

Before applying ANY auto-fix:

1. **Read 20 lines of surrounding context** — understand the code structure before modifying
2. **Match code style** — detect indentation (tabs vs spaces, 2 vs 4), quote style (single vs double), semicolons (yes/no), trailing commas
3. **Maximum change scope** — a single auto-fix should modify no more than 15 lines. If more is needed, flag as manual fix
4. **Never auto-fix if ambiguous** — if there are multiple valid remediation approaches, ask the user
5. **Rollback plan** — all auto-fixes happen after git status is clean. If the project has uncommitted changes, warn the user before applying fixes
6. **Verify after fix** — after applying, re-read the modified file to confirm the fix is syntactically valid

### Auto-Fix Decision Matrix

| Severity | Confidence High | Confidence Medium | Confidence Low |
|---|---|---|---|
| Low | Auto-fix silently | Auto-fix silently | Skip (Info note) |
| Medium | Auto-fix silently | Ask user | Skip (Info note) |
| High | Ask user | Ask user | Manual only |
| Critical | Ask user | Manual only | Manual only |

---

## Low/Medium Severity — Silent Auto-Fixes

### 1. Missing Security Headers (Express.js)

**Before:**
```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
```

**After:**
```javascript
const express = require('express');
const helmet = require('helmet');
const app = express();

app.use(helmet());

app.get('/', (req, res) => {
```

**Detection:** No `helmet` import and no manual header-setting middleware.
**Note:** If `helmet` is not in `package.json`, also run `npm install helmet` or add to dependencies.

### 2. Missing Security Headers (Django)

**Before (settings.py):**
```python
DEBUG = True

ALLOWED_HOSTS = ['*']
```

**After (settings.py):**
```python
DEBUG = True  # ⚠️ Set to False in production

ALLOWED_HOSTS = ['*']  # ⚠️ Restrict to actual domains in production

# Security Headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
# Uncomment in production with HTTPS:
# SECURE_HSTS_SECONDS = 31536000
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
```

### 3. Cookie Security Flags (Express.js)

**Before:**
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    maxAge: 86400000
  }
}));
```

**After:**
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    maxAge: 86400000,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));
```

### 4. Cookie Security Flags (Django)

**Before (settings.py):**
```python
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
```

**After (settings.py):**
```python
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'
```

### 5. .gitignore Entries

**Append to existing `.gitignore` (or create if missing):**
```gitignore

# Security: sensitive files
.env
.env.local
.env.production
.env.*.local
*.pem
*.key
*.p12
*.pfx
credentials.json
service-account*.json
.htpasswd
```

**Detection:** `.env`, `*.pem`, `*.key`, or `credentials.json` exists in repo but not in `.gitignore`.

### 6. .dockerignore

**Create if missing:**
```dockerignore
.git
.gitignore
.env
.env.*
*.pem
*.key
node_modules
__pycache__
*.pyc
.pytest_cache
coverage
.nyc_output
README.md
LICENSE
*.md
docker-compose*.yml
.github
.gitlab-ci.yml
```

### 7. Pin Docker Base Image

**Before:**
```dockerfile
FROM node:latest
```

**After:**
```dockerfile
FROM node:20-alpine
```

**Strategy:** Run `docker pull <image>:latest && docker inspect --format='{{index .RepoDigests 0}}' <image>:latest` to get current digest. If docker isn't available, pin to the current LTS version of the base image.

### 8. Remove Sensitive console.log

**Before:**
```javascript
console.log('User password:', password);
console.log('Token:', authToken);
```

**After:**
```javascript
// Sensitive data removed from console output
console.log('User authentication attempted');
console.log('Token issued');
```

**Detection:** `console.log` containing `password`, `token`, `secret`, `key`, `credential`, `authorization`.

### 9. Add Referrer-Policy Header (Express.js)

**If helmet is already present, no change needed (helmet sets it).**

**If no helmet, add middleware:**
```javascript
app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

### 10. SameSite Cookie Attribute (PHP)

**Before (php.ini or runtime):**
```php
session_start();
```

**After:**
```php
session_set_cookie_params([
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();
```

---

## High/Critical Severity — User-Confirmed Auto-Fixes

### 11. SQL Injection — Parameterize Query (Node.js/pg)

**Before:**
```javascript
const result = await db.query(
  "SELECT * FROM users WHERE id = " + req.params.id
);
```

**After:**
```javascript
const result = await db.query(
  "SELECT * FROM users WHERE id = $1",
  [req.params.id]
);
```

### 12. SQL Injection — Parameterize Query (Python/psycopg2)

**Before:**
```python
cursor.execute(f"SELECT * FROM users WHERE id = {request.args['id']}")
```

**After:**
```python
cursor.execute("SELECT * FROM users WHERE id = %s", (request.args['id'],))
```

### 13. SQL Injection — Parameterize Query (Java/JDBC)

**Before:**
```java
Statement stmt = conn.createStatement();
ResultSet rs = stmt.executeQuery("SELECT * FROM users WHERE id = " + request.getParameter("id"));
```

**After:**
```java
PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");
stmt.setString(1, request.getParameter("id"));
ResultSet rs = stmt.executeQuery();
```

### 14. XSS — Replace innerHTML (JavaScript)

**Before:**
```javascript
element.innerHTML = userInput;
```

**After:**
```javascript
element.textContent = userInput;
```

**Note:** Only auto-fix if the assignment is plaintext. If HTML rendering is intentional, recommend DOMPurify instead.

### 15. XSS — Replace dangerouslySetInnerHTML (React)

**Before:**
```jsx
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**After:**
```jsx
import DOMPurify from 'dompurify';
// ...
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### 16. Command Injection — Replace exec (Node.js)

**Before:**
```javascript
const { exec } = require('child_process');
exec(`convert ${req.body.filename} output.png`, callback);
```

**After:**
```javascript
const { execFile } = require('child_process');
execFile('convert', [req.body.filename, 'output.png'], callback);
```

### 17. Command Injection — Remove shell=True (Python)

**Before:**
```python
subprocess.run(f"convert {filename} output.png", shell=True)
```

**After:**
```python
subprocess.run(["convert", filename, "output.png"])
```

### 18. Unsafe Deserialization (Python)

**Before:**
```python
import yaml
config = yaml.load(data)
```

**After:**
```python
import yaml
config = yaml.safe_load(data)
```

**Before:**
```python
import pickle
obj = pickle.load(file)
```

**After (if JSON is suitable):**
```python
import json
obj = json.load(file)
```

### 19. JWT Algorithm Restriction (Node.js)

**Before:**
```javascript
const decoded = jwt.verify(token, secret);
```

**After:**
```javascript
const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
```

### 20. Hardcoded Secret → Environment Variable (Generic)

**Before:**
```javascript
const apiKey = "sk_live_abc123def456ghi789";
```

**After:**
```javascript
const apiKey = process.env.STRIPE_API_KEY;
```

**Before (Python):**
```python
API_KEY = "AIzaSyB1234567890abcdefghij"
```

**After:**
```python
import os
API_KEY = os.environ["GOOGLE_API_KEY"]
```

**Note:** After replacing, remind the user to add the value to their `.env` file or secrets manager.

### 21. CSRF Protection (Express.js)

**Before:**
```javascript
app.post('/transfer', (req, res) => {
```

**After:**
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
// ...
app.post('/transfer', csrfProtection, (req, res) => {
```

### 22. Disabled TLS Verification (Node.js)

**Before:**
```javascript
const agent = new https.Agent({ rejectUnauthorized: false });
```

**After:**
```javascript
const agent = new https.Agent({ rejectUnauthorized: true });
```

### 23. Disabled TLS Verification (Python)

**Before:**
```python
response = requests.get(url, verify=False)
```

**After:**
```python
response = requests.get(url, verify=True)
```

---

## What NOT to Auto-Fix

Never auto-fix these — always flag as manual remediation:

1. **Architecture-level auth changes** — adding auth middleware requires understanding the full route structure
2. **Database schema changes** — adding encryption columns, changing password storage
3. **Third-party integrations** — rotating API keys, configuring WAF rules
4. **Complex refactors** — breaking apart a God function to add validation layers
5. **Anything in production config** — risk of downtime; require human review
6. **Multi-file changes** — if a fix requires changes across 3+ files, flag as manual
7. **Secrets rotation** — can auto-replace the reference but user must generate new secret
