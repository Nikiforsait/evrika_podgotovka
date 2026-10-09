# Dependency & Supply Chain Audit Guide

Reference file for Phase 3 (Dependency & Supply Chain). Covers CVE checking, lockfile integrity, dependency confusion, and supply chain attack patterns.

---

## Package Manager Audit Commands

### Node.js / npm / yarn / pnpm

**Automated audit (preferred)**
```bash
# npm — built-in audit
npm audit --json 2>/dev/null

# yarn v1
yarn audit --json 2>/dev/null

# yarn v2+
yarn npm audit --json 2>/dev/null

# pnpm
pnpm audit --json 2>/dev/null
```

**Fallback (if CLI not available)** — analyze `package.json` and `package-lock.json` manually:
- Check for known vulnerable versions using patterns below
- Flag packages with no lockfile entry (phantom dependencies)

### Python / pip

**Automated audit**
```bash
# pip-audit
pip-audit --format=json 2>/dev/null

# safety (alternative)
safety check --json 2>/dev/null
```

**Fallback** — analyze `requirements.txt`, `Pipfile.lock`, `poetry.lock`:
- Check for unpinned versions (`package>=1.0` vs `package==1.2.3`)
- Flag `--hash` mode not used in `requirements.txt`

### Ruby / Bundler

**Automated audit**
```bash
bundle audit check --format=json 2>/dev/null
```

**Fallback** — analyze `Gemfile` and `Gemfile.lock`

### Go

**Automated audit**
```bash
govulncheck ./... 2>/dev/null
```

**Fallback** — analyze `go.sum` for known vulnerable modules

### Java / Maven / Gradle

**Automated audit**
```bash
# Maven (requires OWASP dependency-check plugin)
mvn dependency-check:check 2>/dev/null

# Gradle
gradle dependencyCheckAnalyze 2>/dev/null
```

**Fallback** — analyze `pom.xml` or `build.gradle` for known vulnerable versions

### Rust / Cargo

**Automated audit**
```bash
cargo audit --json 2>/dev/null
```

### PHP / Composer

**Automated audit**
```bash
composer audit --format=json 2>/dev/null
```

**Fallback** — analyze `composer.lock`

---

## Lockfile Integrity Checks

### What to check

| Check | Severity | Description |
|---|---|---|
| Lockfile exists | High | Missing lockfile means builds aren't reproducible |
| Lockfile matches manifest | High | `package-lock.json` out of sync with `package.json` |
| Lockfile in `.gitignore` | Medium | Lockfiles should be committed (except for libraries) |
| Registry URLs | High | All packages should come from official registry |
| Integrity hashes | Medium | Lockfile should contain integrity/checksum hashes |
| Resolved URLs | High | Check for non-standard/internal registry URLs that might indicate dependency confusion |

### Lockfile existence patterns

```
# Node.js — one of these should exist
package-lock.json OR yarn.lock OR pnpm-lock.yaml

# Python — one of these should exist
Pipfile.lock OR poetry.lock OR requirements.txt (with hashes)

# Ruby
Gemfile.lock

# Go
go.sum

# Rust
Cargo.lock

# PHP
composer.lock

# Java
(Maven/Gradle don't have lockfiles by default — flag if not using dependency locking)
```

### Registry URL checks

```
# npm — check resolved URLs in package-lock.json
# All should point to: https://registry.npmjs.org/
# Flag any: http:// (non-HTTPS), internal registries, unexpected domains

# Python — check index-url in pip.conf or requirements.txt
# Flag: --index-url pointing to non-PyPI registries without --extra-index-url

# Ruby — check source in Gemfile
# All should be: https://rubygems.org
```

---

## Dependency Confusion / Substitution Attacks

### What to check

**Private package naming**
- Pattern: packages with `@scope/` prefix in package.json where scope is org-specific
- Risk: if the scope isn't claimed on public registry, attacker can publish malicious package
- Check: verify private packages use org-controlled scopes

**Typosquatting indicators**
- Pattern: package names similar to popular packages but with typos
- Examples: `loadsh` vs `lodash`, `requets` vs `requests`
- Check: compare dependency names against known popular packages

**Install scripts**
- Pattern (npm): packages with `preinstall`, `install`, or `postinstall` scripts
- Check: `npm ls --json` and review `scripts` in dependencies' `package.json`
- Risk: install scripts execute arbitrary code during `npm install`

---

## Version Pinning Analysis

### Severity by pinning strategy

| Strategy | Example | Severity | Risk |
|---|---|---|---|
| Exact pin | `1.2.3` | Low | Reproducible but may miss patches |
| Patch range | `~1.2.3` | Low | Accepts patches, reasonable |
| Minor range | `^1.2.3` | Medium | Could pull in breaking changes |
| Major range | `>=1.0.0` | High | Unpredictable version resolution |
| Star/Any | `*` or `latest` | Critical | Completely unpinned |
| Git URL | `git://...` | High | Not auditable through registry |
| URL | `https://...` | High | Not auditable; could change at any time |

### Check patterns

```
# npm/yarn — in package.json
"dependencies": {
  "pkg": "*"          # Critical — unpinned
  "pkg": ">=1.0"      # High — too loose
  "pkg": "^1.0.0"     # Medium — minor range
  "pkg": "~1.0.0"     # Low — patch range
  "pkg": "1.0.0"      # OK — exact
}

# Python — in requirements.txt
pkg                    # Critical — no version
pkg>=1.0               # High — lower bound only
pkg>=1.0,<2.0          # Medium — range
pkg~=1.0.0             # Low — compatible release
pkg==1.0.0             # OK — exact

# Ruby — in Gemfile
gem 'pkg'              # Critical — no version
gem 'pkg', '>= 1.0'   # High — too loose
gem 'pkg', '~> 1.0'   # Low — pessimistic
gem 'pkg', '1.0.0'    # OK — exact
```

---

## Known Vulnerable Package Patterns

Flag if these specific vulnerable versions are detected:

### Node.js
- `lodash` < 4.17.21 (prototype pollution — CVE-2021-23337)
- `express` < 4.19.2 (open redirect — CVE-2024-29041)
- `jsonwebtoken` < 9.0.0 (algorithm confusion — CVE-2022-23529)
- `axios` < 1.6.0 (SSRF — CVE-2023-45857)
- `minimatch` < 3.0.5 (ReDoS — CVE-2022-3517)
- `node-fetch` < 2.6.7 (SSRF — CVE-2022-0235)
- `tar` < 6.1.9 (path traversal — CVE-2021-37713)
- `ua-parser-js` < 0.7.33 (supply chain attack — CVE-2021-27292)

### Python
- `django` < 4.2.14 (multiple CVEs)
- `flask` < 2.3.2 (request smuggling)
- `requests` < 2.31.0 (information leak — CVE-2023-32681)
- `cryptography` < 41.0.0 (multiple CVEs)
- `pillow` < 10.0.1 (multiple CVEs)
- `pyyaml` < 6.0.1 (arbitrary code execution with `yaml.load`)
- `jinja2` < 3.1.3 (XSS — CVE-2024-22195)
- `urllib3` < 2.0.6 (request smuggling — CVE-2023-43804)

### Ruby
- `rails` < 7.0.8 (multiple CVEs)
- `rack` < 3.0.9 (ReDoS, header injection)
- `nokogiri` < 1.16.0 (multiple CVEs in libxml2)

### Java
- `log4j-core` 2.0–2.17.0 (Log4Shell — CVE-2021-44228) **Critical**
- `spring-framework` < 6.0.14 (multiple CVEs)
- `jackson-databind` < 2.15.3 (deserialization — multiple CVEs)
- `commons-text` < 1.10.0 (Text4Shell — CVE-2022-42889)

---

## Remediation Guidance

### Auto-fixable (Low/Medium)

1. **Missing lockfile**: Generate with `npm install --package-lock-only` / `pip freeze > requirements.txt`
2. **Lockfile in .gitignore**: Remove from `.gitignore`
3. **Unpinned dev dependencies**: Pin to current installed version

### Requires confirmation (High/Critical)

1. **Vulnerable dependency**: Update to patched version (may have breaking changes)
2. **Dependency confusion risk**: Add `.npmrc` with `registry=` and scope configuration
3. **Install scripts in dependencies**: Audit scripts and add to allowlist or remove package

### Manual only

1. **Secret in dependency configuration**: Rotate credentials
2. **Compromised package in history**: Full audit of what the package had access to
3. **Vendor lock-in on specific vulnerable version**: Evaluate alternatives
