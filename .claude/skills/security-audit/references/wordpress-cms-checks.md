# WordPress & CMS Security Checks

Reference file for CMS-specific security audits. Covers WordPress, Drupal, Joomla, and general CMS hardening patterns with detection regex, risk analysis, and remediation guidance.

---

## WordPress: Configuration Exposure

### Critical

**wp-config.php Database Credentials Exposed**
- Pattern: `define\s*\(\s*['"]DB_(NAME|USER|PASSWORD|HOST)['"]\s*,\s*['"][^'"]+['"]\s*\)`
- Check: wp-config.php accessible via web (HTTP 200 on /wp-config.php)
- Risk: Full database compromise — attacker gains direct access to all WordPress data, user credentials, and can escalate to remote code execution
- Remediation: Move wp-config.php above web root, or deny access via `.htaccess`:
  ```
  <files wp-config.php>
  order allow,deny
  deny from all
  </files>
  ```
- Auto-fix: Add deny rule to .htaccess

**wp-config.php Auth Keys/Salts Set to Default or Empty**
- Pattern: `define\s*\(\s*['"]AUTH_KEY['"]\s*,\s*['"]put your unique phrase here['"]\s*\)`
- Pattern: `define\s*\(\s*['"](AUTH_KEY|SECURE_AUTH_KEY|LOGGED_IN_KEY|NONCE_KEY|AUTH_SALT|SECURE_AUTH_SALT|LOGGED_IN_SALT|NONCE_SALT)['"]\s*,\s*['"]['"]`
- Risk: Session hijacking and cookie forgery — default salts allow attackers to generate valid authentication cookies
- Remediation: Generate fresh keys via https://api.wordpress.org/secret-key/1.1/salt/ and paste into wp-config.php

**Debug Mode Enabled in Production (WP_DEBUG)**
- Pattern: `define\s*\(\s*['"]WP_DEBUG['"]\s*,\s*true\s*\)`
- Pattern: `define\s*\(\s*['"]WP_DEBUG_DISPLAY['"]\s*,\s*true\s*\)`
- Pattern: `define\s*\(\s*['"]WP_DEBUG_LOG['"]\s*,\s*true\s*\)`
- Risk: Stack traces, file paths, database queries, and PHP errors displayed to users — reveals internal architecture and can leak credentials
- Remediation: Set `WP_DEBUG` to `false` in production. If logging is needed, set `WP_DEBUG_DISPLAY` to `false` and `WP_DEBUG_LOG` to `true` with a non-default log path
- Auto-fix: Set WP_DEBUG to false

### High

**Default Database Table Prefix (wp_)**
- Pattern: `\$table_prefix\s*=\s*['"]wp_['"]`
- Risk: Makes automated SQL injection attacks easier — attackers know exact table names (`wp_users`, `wp_options`)
- Remediation: Change table prefix to a random string during installation. For existing sites, rename tables and update wp-config.php and `wp_options.option_name`, `wp_usermeta.meta_key` references

**SSL/TLS Not Enforced for Admin**
- Pattern: Absence of `define\s*\(\s*['"]FORCE_SSL_ADMIN['"]\s*,\s*true\s*\)`
- Pattern: Absence of `define\s*\(\s*['"]FORCE_SSL_LOGIN['"]\s*,\s*true\s*\)`
- Risk: Admin credentials transmitted in cleartext over HTTP, vulnerable to MITM interception
- Remediation: Add `define('FORCE_SSL_ADMIN', true);` to wp-config.php and ensure a valid TLS certificate is installed

**File Editing Enabled in Dashboard**
- Pattern: Absence of `define\s*\(\s*['"]DISALLOW_FILE_EDIT['"]\s*,\s*true\s*\)`
- Risk: Compromised admin account can inject arbitrary PHP code via Appearance > Theme Editor or Plugins > Plugin Editor
- Remediation: Add `define('DISALLOW_FILE_EDIT', true);` to wp-config.php
- Auto-fix: Add DISALLOW_FILE_EDIT constant

### Medium

**Automatic Updates Disabled**
- Pattern: `define\s*\(\s*['"]AUTOMATIC_UPDATER_DISABLED['"]\s*,\s*true\s*\)`
- Pattern: `define\s*\(\s*['"]WP_AUTO_UPDATE_CORE['"]\s*,\s*false\s*\)`
- Risk: Missed critical security patches leave known vulnerabilities unpatched
- Remediation: Enable at least minor/security auto-updates: `define('WP_AUTO_UPDATE_CORE', 'minor');`

**Database Connection Uses Localhost Without Socket Restriction**
- Pattern: `define\s*\(\s*['"]DB_HOST['"]\s*,\s*['"]localhost['"]\s*\)`
- Check: Verify database is not exposed to public network
- Risk: Low if properly firewalled, but should verify MySQL is bound to 127.0.0.1 only

---

## WordPress: XMLRPC Attacks

### Critical

**XMLRPC Brute Force via system.multicall**
- Check: xmlrpc.php accessible (HTTP 200 or 405 on /xmlrpc.php)
- Pattern: `<methodName>system\.multicall</methodName>` in access logs
- Risk: Attackers can attempt hundreds of username/password combinations in a single HTTP request via `system.multicall`, bypassing rate limiting
- Remediation: Disable XMLRPC entirely if not needed. Block via .htaccess:
  ```
  <files xmlrpc.php>
  order deny,allow
  deny from all
  </files>
  ```
  Or use a plugin to disable specific XMLRPC methods

### High

**XMLRPC Pingback DDoS Amplification**
- Pattern: `<methodName>pingback\.ping</methodName>` in access logs
- Check: POST to /xmlrpc.php with pingback.ping method returns success
- Risk: Site can be used as a DDoS amplification vector against third-party targets
- Remediation: Disable pingbacks or block xmlrpc.php entirely. Add filter: `add_filter('xmlrpc_methods', function($methods) { unset($methods['pingback.ping']); return $methods; });`

---

## WordPress: Admin & Authentication Exposure

### High

**Admin URL Not Restricted**
- Check: /wp-admin/ and /wp-login.php publicly accessible without IP restriction
- Pattern: HTTP 200 or 302 on `/wp-login\.php`
- Risk: Enables brute force attacks against admin login
- Remediation: Restrict access by IP, add 2FA, use a plugin to change the login URL, or add HTTP basic auth as an additional layer

**User Enumeration via Author Archives**
- Check: `/?author=1` redirects to `/author/username/`
- Pattern: HTTP 301/302 response to `\?author=\d+` revealing usernames
- Risk: Attackers enumerate valid usernames to target in brute force attacks
- Remediation: Block author enumeration via .htaccess:
  ```
  RewriteCond %{QUERY_STRING} ^author=\d+
  RewriteRule ^ /? [R=301,L]
  ```

**User Enumeration via REST API**
- Check: `/wp-json/wp/v2/users` returns user list without authentication
- Pattern: HTTP 200 on `/wp-json/wp/v2/users` containing `"slug":"admin"`
- Risk: Exposes usernames, IDs, and user metadata to unauthenticated users
- Remediation: Restrict the users endpoint:
  ```php
  add_filter('rest_authentication_errors', function($result) {
      if (!is_user_logged_in()) { return new WP_Error('rest_forbidden', 'Authentication required', array('status' => 401)); }
      return $result;
  });
  ```

### Medium

**Default Admin Username**
- Check: User with login `admin` or `administrator` exists
- Pattern: `user_login\s*=\s*['"]admin['"]`
- Risk: Reduces brute force attack space — attacker only needs to guess the password
- Remediation: Create a new admin user with a unique username, reassign content, and delete the default account

**wp-cron Abuse (Publicly Accessible)**
- Check: `/wp-cron.php` accessible via HTTP (returns 200)
- Pattern: Absence of `define\s*\(\s*['"]DISABLE_WP_CRON['"]\s*,\s*true\s*\)`
- Risk: DDoS vector — repeated requests trigger resource-intensive scheduled tasks. Can also be used for timing attacks
- Remediation: Disable WP-Cron in wp-config.php and use a real system cron:
  ```
  define('DISABLE_WP_CRON', true);
  # System cron: */5 * * * * curl -s https://example.com/wp-cron.php > /dev/null
  ```

---

## WordPress: Plugins & Themes

### Critical

**Nulled or Pirated Themes/Plugins**
- Pattern: `base64_decode\s*\(` in theme/plugin files (common backdoor indicator)
- Pattern: `eval\s*\(\s*base64_decode\s*\(` — almost always malicious
- Pattern: `\$_(?:GET|POST|REQUEST|COOKIE)\s*\[.*\]\s*\)` inside `eval()` or `assert()`
- Pattern: `preg_replace\s*\(\s*['"]/.*e['"]` (eval modifier — deprecated but still exploitable)
- Risk: Backdoor access, data theft, full server compromise
- Remediation: Remove immediately. Install plugins/themes only from wordpress.org or verified commercial vendors. Scan with Wordfence or Sucuri

**File Upload Vulnerability in Plugins**
- Pattern: `move_uploaded_file\s*\(` without mime type validation or extension whitelist
- Pattern: `wp_handle_upload\s*\(` with overridden `test_form` or `mimes` filters
- Pattern: `\$_FILES\s*\[` without `wp_check_filetype_and_ext\(`
- Risk: Remote code execution via uploaded PHP shells disguised as images
- Remediation: Always validate file type using `wp_check_filetype_and_ext()`. Restrict uploads to expected extensions. Add to .htaccess in uploads directory:
  ```
  <FilesMatch "\.(php|phtml|php3|php4|php5|pl|py|cgi|shtml|sh)$">
  deny from all
  </FilesMatch>
  ```

### High

**Outdated Plugins with Known Vulnerabilities**
- Check: Compare installed plugin versions against WPScan Vulnerability Database
- Pattern: Check `wp-content/plugins/*/readme.txt` for `Stable tag:` version
- Risk: Known exploits are automated — outdated plugins are the #1 WordPress attack vector
- Remediation: Update all plugins immediately. Remove unused plugins entirely (deactivating is not sufficient)

**Direct PHP File Access in Plugins/Themes**
- Pattern: PHP files without `defined\s*\(\s*['"]ABSPATH['"]\s*\)` or `defined\s*\(\s*['"]WPINC['"]\s*\)` guard at top
- Risk: Direct access to PHP files can bypass WordPress security context, exposing raw functionality
- Remediation: Add to the top of every PHP file:
  ```php
  if (!defined('ABSPATH')) { exit; }
  ```
- Auto-fix: Prepend ABSPATH check to unguarded PHP files

### Medium

**Theme Missing Security Headers**
- Pattern: Absence of `wp_headers` filter or `send_headers` action in theme
- Pattern: No `header\s*\(\s*['"]X-Content-Type-Options` in functions.php
- Risk: Missing CSP, X-Frame-Options, and other headers leave site vulnerable to XSS and clickjacking
- Remediation: Add security headers via functions.php:
  ```php
  add_action('send_headers', function() {
      header('X-Content-Type-Options: nosniff');
      header('X-Frame-Options: SAMEORIGIN');
      header('Referrer-Policy: strict-origin-when-cross-origin');
  });
  ```

---

## WordPress: File Permissions & Directory Security

### Critical

**wp-config.php World-Readable**
- Check: File permissions on wp-config.php are 644 or more permissive
- Pattern: `ls -la wp-config.php` shows `-rw-r--r--` or worse
- Risk: Any user on shared hosting can read database credentials and auth keys
- Remediation: Set permissions to 400 or 440: `chmod 400 wp-config.php`

**Uploads Directory Allows PHP Execution**
- Check: PHP files can be executed in /wp-content/uploads/
- Pattern: Absence of `.htaccess` in uploads directory denying PHP execution
- Risk: Uploaded PHP shells execute directly — primary post-exploitation vector
- Remediation: Add `.htaccess` to wp-content/uploads/:
  ```
  <FilesMatch "\.(?:php|phtml|php3|php4|php5|phps)$">
  deny from all
  </FilesMatch>
  ```
- Auto-fix: Create restrictive .htaccess in uploads directory

### High

**Directory Listing Enabled**
- Check: HTTP 200 with directory index on /wp-content/plugins/, /wp-content/uploads/, /wp-includes/
- Pattern: Absence of `Options -Indexes` in .htaccess
- Risk: Exposes installed plugins, uploaded files, and internal structure to attackers for reconnaissance
- Remediation: Add `Options -Indexes` to root .htaccess or disable in Apache config
- Auto-fix: Add Options -Indexes to .htaccess

**Sensitive Files Publicly Accessible**
- Check: HTTP 200 on `/readme.html`, `/license.txt`, `/wp-config-sample.php`
- Check: HTTP 200 on `/wp-content/debug.log`
- Risk: readme.html reveals WordPress version. debug.log can contain credentials, SQL queries, and full stack traces
- Remediation: Delete readme.html and license.txt. Block access to debug.log. Move debug.log outside web root

### Medium

**Insecure File Permissions on wp-content**
- Check: Directories with 777 permissions or files with 666
- Pattern: `find . -type d -perm 777` or `find . -type f -perm 666`
- Risk: Any user or process on the server can modify WordPress files, inject code
- Remediation: Directories should be 755, files should be 644, wp-config.php should be 400

---

## WordPress: REST API Security

### High

**REST API Fully Exposed Without Authentication**
- Check: `/wp-json/` returns full API schema without authentication
- Pattern: HTTP 200 on `/wp-json/wp/v2/` endpoints (posts, pages, comments, users)
- Risk: Exposes content, user data, and site structure. Certain endpoints allow unauthenticated data modification
- Remediation: Require authentication for non-public endpoints:
  ```php
  add_filter('rest_authentication_errors', function($result) {
      if (true === $result || is_wp_error($result)) { return $result; }
      if (!is_user_logged_in()) {
          return new WP_Error('rest_not_logged_in', 'API access restricted.', array('status' => 401));
      }
      return $result;
  });
  ```

**REST API Exposes Sensitive Post Meta**
- Pattern: `register_meta\s*\(.*['"]show_in_rest['"]\s*=>\s*true` on sensitive meta keys
- Pattern: `register_rest_field\s*\(` exposing custom fields without permission callbacks
- Risk: Private metadata (internal notes, configuration, pricing logic) exposed publicly
- Remediation: Use `auth_callback` in `register_meta()` and `permission_callback` in custom REST routes

### Medium

**No Rate Limiting on REST API**
- Check: Unlimited requests to /wp-json/ endpoints
- Risk: API abuse, data scraping, brute force via REST endpoints
- Remediation: Implement rate limiting via plugin (e.g., WP REST API Rate Limiting) or at the server level (nginx limit_req, mod_ratelimit)

---

## Drupal Security Checks

### Critical

**settings.php Exposure**
- Pattern: `\$databases\s*=\s*array\s*\(` or `\$databases\s*\[` in publicly accessible settings.php
- Check: HTTP 200 on `/sites/default/settings.php`
- Risk: Full database credential exposure — complete site compromise
- Remediation: Ensure settings.php is not accessible via web. Set file permissions to 444. Verify `.htaccess` denies access to .php files in sites/default/

**SQL Injection in Custom Modules (Missing Placeholders)**
- Pattern: `db_query\s*\(\s*['"].*\$` (variable interpolation instead of placeholders)
- Pattern: `\->query\s*\(\s*['"].*\$` (direct variable in query string)
- Pattern: `db_query\s*\(.*\.\s*\$` (string concatenation in query)
- Risk: SQL injection — full database compromise, data exfiltration, authentication bypass
- Remediation: Always use placeholders:
  ```php
  // WRONG: db_query("SELECT * FROM {users} WHERE name = '$name'");
  // RIGHT: db_query("SELECT * FROM {users} WHERE name = :name", array(':name' => $name));
  ```

### High

**Untrusted Input in Twig Templates**
- Pattern: `\{\{\s*raw\s*\}\}` or `\|raw` filter in Twig templates
- Pattern: `\{\{\s*[^}]*\|raw\s*\}\}` — bypasses Twig auto-escaping
- Risk: Cross-site scripting (XSS) — raw filter disables Drupal's automatic output escaping
- Remediation: Remove `|raw` filter. Use `|escape` or Drupal's built-in sanitization. Only use `|raw` for trusted, pre-sanitized content

**Update Status Module Publicly Accessible**
- Check: `/admin/reports/updates` accessible without authentication
- Check: Update XML data exposed at `/admin/reports/updates/check`
- Risk: Reveals exact Drupal core and module versions, enabling targeted exploit selection
- Remediation: Restrict access to update status page via permissions. Block at web server level for non-admin IPs

**Views Without Access Control**
- Pattern: Views with `access:` set to `none` or missing access configuration
- Pattern: Custom views endpoint without `'access callback'` or with `'access callback' => TRUE`
- Risk: Unauthorized data access — views may expose content, user data, or internal records
- Remediation: Set appropriate access controls on all views (role-based or permission-based)

### Medium

**Drupal Core Not Updated**
- Check: Compare `Drupal.settings.basePath` or CHANGELOG.txt version against latest release
- Pattern: `/CHANGELOG.txt` publicly accessible revealing version
- Risk: Known Drupal vulnerabilities (e.g., Drupalgeddon) are actively exploited within hours of disclosure
- Remediation: Subscribe to Drupal security advisories. Apply updates immediately, especially for SA-CORE advisories

---

## Joomla Security Checks

### Critical

**configuration.php Exposure**
- Pattern: `\$host\s*=\s*['"]|public\s+\$password\s*=\s*['"]|public\s+\$db\s*=\s*['"]`
- Check: HTTP 200 on `/configuration.php` or `/configuration.php-dist`
- Risk: Database credentials, secret key, and FTP credentials exposed
- Remediation: Block direct access. Verify `.htaccess` is functioning. Set file permissions to 444

### High

**Joomla Debug Mode Enabled**
- Pattern: `public\s+\$debug\s*=\s*['"]?1|public\s+\$debug\s*=\s*true`
- Risk: Displays detailed error messages, query logs, and memory usage to all users
- Remediation: Set `$debug = 0` in configuration.php for production

**Exposed Administrator Panel**
- Check: `/administrator/` login page publicly accessible
- Risk: Brute force attacks, credential stuffing
- Remediation: Restrict /administrator/ access by IP. Add a secret URL parameter. Enable 2FA for all admin accounts

---

## General CMS Security Checks

### Critical

**Default Admin Credentials**
- Check: Ability to log in with `admin/admin`, `admin/password`, `admin/123456`, `administrator/administrator`
- Pattern: Default credentials for known CMS platforms:
  - WordPress: `admin/admin`
  - Drupal: `admin/admin`
  - Joomla: `admin/admin`
- Risk: Complete site takeover — automated bots continuously scan for default credentials
- Remediation: Change default credentials immediately after installation. Enforce strong password policy. Delete or rename the default admin account

**Outdated CMS Core Version**
- Check: Compare running version against latest stable release
- Pattern (WordPress): `<meta name="generator" content="WordPress [\d\.]+"` or `/feed/` generator tag
- Pattern (Drupal): `CHANGELOG\.txt|Drupal\s+[\d\.]+` or `meta.*Generator.*Drupal`
- Pattern (Joomla): `<meta name="generator" content="Joomla`
- Risk: Known vulnerabilities in outdated CMS cores are exploited at scale by automated tools
- Remediation: Update to latest stable version. Enable automatic security updates where available. Remove version meta tags to reduce information disclosure

### High

**Missing Two-Factor Authentication on Admin Accounts**
- Check: No 2FA plugin installed or 2FA not enforced for admin role
- Pattern (WordPress): Absence of common 2FA plugins in active plugins list
- Risk: Single-factor authentication — compromised password means full site compromise
- Remediation: Install and enforce 2FA for all admin and editor accounts. Use TOTP-based 2FA (Google Authenticator, Authy)

**No Brute Force Protection**
- Check: Unlimited login attempts permitted without lockout or delay
- Pattern (WordPress): Absence of login-limiting plugin. No `limit_login_attempts` or `wp_login_failed` hook
- Risk: Automated credential attacks succeed given enough time
- Remediation: Install brute force protection (Limit Login Attempts, Wordfence, fail2ban). Implement progressive delays and account lockout after failed attempts
- Auto-fix: Recommend specific brute force protection plugin

**User Role Escalation**
- Pattern: `wp_update_user\s*\(.*role` without capability check
- Pattern: `user_register` hook that assigns elevated roles based on user input
- Pattern: `\$_(?:POST|GET|REQUEST)\s*\[.*role` — user-controlled role assignment
- Risk: Unprivileged users escalate to admin role
- Remediation: Never trust user input for role assignment. Always verify `current_user_can()` before role changes

**Exposed Admin Panels Without IP Restriction**
- Check: Admin login pages accessible from any IP
- Check (WordPress): `/wp-admin/`, `/wp-login.php`
- Check (Drupal): `/user/login`, `/admin/`
- Check (Joomla): `/administrator/`
- Risk: Exposes authentication endpoints to global brute force, credential stuffing, and zero-day exploitation
- Remediation: Restrict admin paths by IP at web server level. Use VPN for admin access. Add additional authentication layer (HTTP basic auth, client certificates)

### Medium

**Missing Content Security Policy**
- Check: No CSP header on CMS front-end or admin pages
- Pattern: Absence of CSP header or meta tag
- Risk: XSS attacks can load external scripts, exfiltrate data, or deface the site
- Remediation: Implement CSP via security plugin or web server configuration. Start with report-only mode to avoid breaking functionality:
  ```
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  ```

**Insecure File Upload Configuration**
- Pattern: Allowed MIME types include `application/x-php`, `text/x-php`, or no MIME validation
- Pattern: Upload directory without execution restriction
- Pattern: Client-side-only file type validation (JavaScript check without server-side validation)
- Risk: Webshell upload leading to remote code execution
- Remediation: Validate MIME type server-side. Restrict allowed extensions to a whitelist. Disable script execution in upload directories. Rename uploaded files to random names

**CMS Version Disclosure**
- Pattern: `<meta\s+name=["']generator["']\s+content=["']` revealing CMS and version
- Pattern: Unique default files that fingerprint the CMS (readme.html, CHANGELOG.txt, web.config)
- Risk: Enables targeted attacks using version-specific exploits
- Remediation: Remove generator meta tags. Block access to version-revealing files. Use a security plugin to strip version info from headers and feeds

### Low

**XML-RPC / Remote API Enabled When Not Needed**
- Check: Remote API endpoints enabled but unused
- Risk: Increases attack surface unnecessarily
- Remediation: Disable remote APIs that are not actively used by the site or its integrations

**Default CMS Paths Not Changed**
- Check: Standard CMS paths remain at default locations
- Risk: Automated scanners target default paths — changing them adds a layer of obscurity (not security, but reduces noise)
- Remediation: Consider using plugins or server configuration to change default admin URLs. This is defense-in-depth, not a primary control

**Verbose Error Messages in Production**
- Pattern: `display_errors\s*=\s*On|error_reporting\s*\(\s*E_ALL\s*\)`
- Pattern: `ini_set\s*\(\s*['"]display_errors['"]\s*,\s*['"]?1`
- Risk: Information disclosure — stack traces reveal file paths, database structure, and internal logic
- Remediation: Set `display_errors = Off` in php.ini. Log errors to a file instead of displaying them

---

## Detection Command Examples

```bash
# WordPress version detection
grep -r 'generator.*WordPress' wp-includes/version.php

# Find wp-config.php exposure indicators
grep -rn "define.*DB_PASSWORD" wp-config.php

# Check for default table prefix
grep -n "table_prefix.*wp_" wp-config.php

# Find debug mode enabled
grep -rn "WP_DEBUG.*true" wp-config.php

# Detect eval(base64_decode()) backdoors in themes/plugins
grep -rn "eval\s*(.*base64_decode" wp-content/

# Find files without ABSPATH check
grep -rL "defined.*ABSPATH" wp-content/plugins/*/*.php

# Check for user enumeration exposure
curl -sI "https://example.com/?author=1" | grep -i location

# Check REST API user exposure
curl -s "https://example.com/wp-json/wp/v2/users" | python -m json.tool

# Drupal: find SQL injection risks in custom modules
grep -rn "db_query.*\\\$" modules/custom/

# Find files with insecure permissions
find . -type f -perm /o+w -name "*.php"

# Check for directory listing
curl -sI "https://example.com/wp-content/plugins/" | grep -i "index of"

# Scan for XMLRPC availability
curl -s -X POST "https://example.com/xmlrpc.php" -d '<?xml version="1.0"?><methodCall><methodName>system.listMethods</methodName></methodCall>'
```

---

## Severity Summary

| Category | Critical | High | Medium | Low |
|---|---|---|---|---|
| WP Configuration | 3 | 3 | 2 | 0 |
| WP XMLRPC | 1 | 1 | 0 | 0 |
| WP Auth & Admin | 0 | 3 | 2 | 0 |
| WP Plugins/Themes | 2 | 2 | 1 | 0 |
| WP Files/Dirs | 2 | 2 | 1 | 0 |
| WP REST API | 0 | 2 | 1 | 0 |
| Drupal | 2 | 3 | 1 | 0 |
| Joomla | 1 | 2 | 0 | 0 |
| General CMS | 2 | 4 | 3 | 3 |
