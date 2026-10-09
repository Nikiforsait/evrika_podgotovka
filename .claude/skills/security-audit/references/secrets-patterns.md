# Secrets & Credentials Detection Patterns

Reference file for Phase 6 (Secrets & Credentials). Contains 30+ regex patterns for detecting hardcoded secrets, API keys, tokens, and credentials in source code and configuration files.

---

## Detection Strategy

1. **Pattern matching** — regex against file contents
2. **Entropy analysis** — high-entropy strings in assignments (flag strings >4.5 bits/char entropy in key-value contexts)
3. **Git history scanning** — check commits for secrets that were added then removed
4. **File name checks** — files that commonly contain secrets

---

## File Name Alerts

These file names in the repository (not in `.gitignore`) are immediate findings:

| Pattern | Severity | Description |
|---|---|---|
| `.env` | High | Environment file with potential secrets |
| `.env.local` / `.env.production` | High | Environment overrides |
| `credentials.json` | Critical | GCP or other service credentials |
| `service-account*.json` | Critical | GCP service account key |
| `*-keypair.pem` / `*.key` | Critical | Private keys |
| `id_rsa` / `id_ed25519` | Critical | SSH private keys |
| `.htpasswd` | High | Apache password file |
| `wp-config.php` | High | WordPress config with DB creds |
| `.npmrc` with `_authToken` | High | NPM auth token |
| `.pypirc` | High | PyPI credentials |
| `docker-compose*.yml` with passwords | High | Hardcoded container secrets |
| `kubeconfig` / `.kube/config` | Critical | Kubernetes cluster credentials |
| `terraform.tfvars` | High | Terraform variables (may contain secrets) |

---

## Regex Patterns for Secret Detection

### Cloud Provider Keys

**AWS**
```
# AWS Access Key ID
(?:^|[^A-Za-z0-9/+=])AKIA[A-Z0-9]{16}(?:[^A-Za-z0-9/+=]|$)

# AWS Secret Access Key (in assignment context)
(?:aws_secret_access_key|AWS_SECRET_ACCESS_KEY|aws_secret)\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}['"]?

# AWS Session Token
(?:aws_session_token|AWS_SESSION_TOKEN)\s*[:=]\s*['"]?[A-Za-z0-9/+=]{100,}['"]?

# AWS MWS Key
amzn\.mws\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}
```

**GCP**
```
# GCP API Key
AIza[0-9A-Za-z\-_]{35}

# GCP OAuth Client ID
[0-9]+-[a-z0-9_]{32}\.apps\.googleusercontent\.com

# GCP Service Account (JSON key file pattern)
"type"\s*:\s*"service_account"
```

**Azure**
```
# Azure Storage Account Key
(?:AccountKey|account_key)\s*[:=]\s*['"]?[A-Za-z0-9+/=]{88}['"]?

# Azure AD Client Secret
(?:client_secret|AZURE_CLIENT_SECRET)\s*[:=]\s*['"]?[A-Za-z0-9~._-]{34,}['"]?

# Azure Connection String
(?:DefaultEndpointsProtocol|AccountName|AccountKey|EndpointSuffix)=[^;\s]{5,}
```

### API Keys & Tokens

**GitHub**
```
# GitHub Personal Access Token (classic)
ghp_[A-Za-z0-9]{36}

# GitHub OAuth Access Token
gho_[A-Za-z0-9]{36}

# GitHub App Token
(?:ghu|ghs|ghr)_[A-Za-z0-9]{36}

# GitHub Fine-grained Token
github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}
```

**Stripe**
```
# Stripe Secret Key
sk_(?:live|test)_[A-Za-z0-9]{24,}

# Stripe Restricted Key
rk_(?:live|test)_[A-Za-z0-9]{24,}
```

**Slack**
```
# Slack Bot Token
xoxb-[0-9]{10,}-[0-9]{10,}-[A-Za-z0-9]{24}

# Slack User Token
xoxp-[0-9]{10,}-[0-9]{10,}-[0-9]{10,}-[a-f0-9]{32}

# Slack Webhook URL
https://hooks\.slack\.com/services/T[A-Z0-9]{8,}/B[A-Z0-9]{8,}/[A-Za-z0-9]{24}
```

**Twilio**
```
# Twilio Account SID
AC[a-f0-9]{32}

# Twilio Auth Token
(?:twilio_auth_token|TWILIO_AUTH_TOKEN)\s*[:=]\s*['"]?[a-f0-9]{32}['"]?
```

**SendGrid**
```
# SendGrid API Key
SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}
```

**Mailgun**
```
# Mailgun API Key
key-[A-Za-z0-9]{32}
```

### Database Connection Strings

```
# PostgreSQL
postgres(?:ql)?://[^:]+:[^@]+@[^/]+

# MySQL
mysql://[^:]+:[^@]+@[^/]+

# MongoDB
mongodb(?:\+srv)?://[^:]+:[^@]+@[^/]+

# Redis (with password)
redis://:[^@]+@[^/]+

# MSSQL
Server=.*;.*Password=.*

# JDBC with password
jdbc:[a-z]+://.*password=[^&;\s]+
```

### Private Keys

```
# RSA Private Key
-----BEGIN RSA PRIVATE KEY-----

# EC Private Key
-----BEGIN EC PRIVATE KEY-----

# Generic Private Key
-----BEGIN PRIVATE KEY-----

# PGP Private Key
-----BEGIN PGP PRIVATE KEY BLOCK-----

# OpenSSH Private Key
-----BEGIN OPENSSH PRIVATE KEY-----
```

### JWT & Auth Tokens

```
# JWT Token (header.payload.signature)
eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}

# Bearer Token in code
(?:Bearer|Authorization)\s*[:=]\s*['"](?:Bearer\s+)?[A-Za-z0-9_-]{20,}['"]

# Basic Auth (base64)
(?:Authorization)\s*[:=]\s*['"]Basic\s+[A-Za-z0-9+/=]{10,}['"]
```

### Other Services

**PayPal**
```
# PayPal Braintree Access Token
access_token\$production\$[a-z0-9]{16}\$[a-f0-9]{32}
```

**Square**
```
# Square Access Token
sq0atp-[A-Za-z0-9_-]{22}

# Square OAuth Secret
sq0csp-[A-Za-z0-9_-]{43}
```

**Heroku**
```
# Heroku API Key
(?:heroku_api_key|HEROKU_API_KEY)\s*[:=]\s*['"]?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['"]?
```

**NPM**
```
# NPM Token
(?:npm_token|NPM_TOKEN)\s*[:=]\s*['"]?npm_[A-Za-z0-9]{36}['"]?

# NPM Auth Token in .npmrc
//registry\.npmjs\.org/:_authToken=[A-Za-z0-9_-]+
```

**Docker Hub**
```
# Docker Hub Token
dckr_pat_[A-Za-z0-9_-]{27,}
```

### Generic Patterns

```
# Generic API Key assignment
(?:api_key|apikey|api-key|API_KEY)\s*[:=]\s*['"]?[A-Za-z0-9_-]{20,}['"]?

# Generic Secret assignment
(?:secret|SECRET|client_secret|CLIENT_SECRET)\s*[:=]\s*['"]?[A-Za-z0-9_-]{20,}['"]?

# Generic Password assignment (not in test/mock context)
(?:password|passwd|pwd|PASSWORD|PASSWD)\s*[:=]\s*['"](?!.*(?:test|example|placeholder|changeme|xxxx))[^'"]{8,}['"]

# Generic Token assignment
(?:token|TOKEN|auth_token|access_token|refresh_token)\s*[:=]\s*['"]?[A-Za-z0-9_.-]{20,}['"]?
```

---

## Exclusion Rules (False Positive Reduction)

Do NOT flag:

1. **Test/fixture files**: `*test*`, `*spec*`, `*mock*`, `*fixture*`, `*fake*`, `__tests__/`
2. **Example/template values**: strings containing `example`, `placeholder`, `your-`, `xxx`, `changeme`, `TODO`, `REPLACE`
3. **Documentation**: `*.md`, `*.rst`, `*.txt` (unless `.env.example` patterns)
4. **Lock files**: `package-lock.json`, `yarn.lock`, `Gemfile.lock`, `poetry.lock`
5. **Hash references**: git SHAs, content hashes in build output
6. **Public keys**: `-----BEGIN PUBLIC KEY-----`, `-----BEGIN CERTIFICATE-----`
7. **Empty/null assignments**: `password = ""`, `key = null`, `secret = None`

---

## Git History Scanning

Check for secrets that were committed and then removed:

```bash
# Search git log for secret patterns (use sparingly — can be slow)
git log -p --all -S 'AKIA' -- '*.py' '*.js' '*.ts' '*.env' '*.yml' '*.yaml' '*.json'
git log -p --all -S 'BEGIN RSA PRIVATE KEY' -- .
git log -p --all -S 'sk_live_' -- .
```

If secrets found in history:
- Severity: **Critical** (secrets may still be valid even if removed from current code)
- Remediation: Rotate the secret immediately; consider using `git filter-repo` or BFG Repo Cleaner to purge history

---

## Remediation Guidance

| Finding | Auto-Fix | Manual Action |
|---|---|---|
| `.env` in repository | Add to `.gitignore` (auto) | Rotate exposed secrets |
| Hardcoded API key | Move to env var reference (auto) | Rotate the key |
| Private key in repo | Add to `.gitignore` (auto) | Generate new key pair |
| Secret in git history | N/A | Rotate secret + clean history |
| DB connection string | Move to env var (auto) | Rotate password |
| Exposed JWT secret | Move to env var (auto) | Rotate secret, invalidate tokens |
