# Browser Extension Security Checks

Reference file for Chrome, Firefox, Safari, and Edge extension security audits. Covers manifest permissions, content scripts, background workers, network handling, and extension page security.

---

## Manifest & Permissions

### Critical

**Overly Broad Host Permissions**
- Pattern (manifest.json): `"host_permissions"\s*:\s*\[.*"<all_urls>"` or `"\*://\*/"` or `"http://*/*"` or `"https://*/*"`
- Pattern (V2): `"permissions"\s*:\s*\[.*"<all_urls>"`
- Risk: Extension can read/modify every page the user visits; full browsing data exposure
- Remediation: Restrict to only the domains the extension needs (e.g., `"https://api.example.com/*"`); use `activeTab` for user-initiated actions

**Manifest V2 Still in Use (Deprecated)**
- Pattern: `"manifest_version"\s*:\s*2`
- Risk: V2 allows persistent background pages, broad `webRequest` blocking, and weaker CSP enforcement; Chrome has deprecated V2 and will remove support
- Remediation: Migrate to Manifest V3; replace background pages with service workers, `webRequestBlocking` with `declarativeNetRequest`

**Dangerous Permission Combinations**
- Pattern: `"permissions"\s*:\s*\[` containing both `"webRequest"` and `"<all_urls>"`
- Pattern: `"permissions"` containing `"debugger"` or `"management"`
- Risk: `webRequest` + broad hosts = intercept all traffic; `debugger` = full DevTools control over tabs; `management` = disable other extensions
- Remediation: Remove unused dangerous permissions; justify each permission in review documentation

**Permissive Content Security Policy**
- Pattern (V2): `"content_security_policy"\s*:.*unsafe-eval|unsafe-inline`
- Pattern (V3): `"content_security_policy"\s*:\s*\{.*"extension_pages"\s*:.*unsafe-eval`
- Risk: Allows `eval()` or inline scripts in extension pages, enabling code injection attacks
- Remediation: Remove `unsafe-eval` and `unsafe-inline`; use nonce-based CSP if dynamic content is needed

### High

**Native Messaging Permission**
- Pattern: `"permissions"\s*:\s*\[.*"nativeMessaging"`
- Pattern: `"allowed_origins"` in native messaging host manifest
- Risk: Bridges browser sandbox to native OS; compromised extension can execute arbitrary system commands
- Remediation: Only use when absolutely required; validate all messages from native host; restrict `allowed_origins`

**Externally Connectable with Wildcards**
- Pattern: `"externally_connectable"\s*:\s*\{.*"matches"\s*:\s*\[.*"\*"`
- Risk: Any website matching the wildcard can send messages to the extension via `chrome.runtime.sendMessage`
- Remediation: Restrict `matches` to specific, trusted origins; never use `"*"` or `"*://*.example.com/*"` broadly

**Overly Broad Content Script Matches**
- Pattern (manifest.json): `"content_scripts".*"matches"\s*:\s*\[.*"<all_urls>"|"\*://\*/\*"`
- Risk: Content script injected into every page; increases attack surface and performance impact
- Remediation: Narrow match patterns to required sites; use `activeTab` + programmatic injection instead

### Medium

**activeTab Not Used Where Appropriate**
- Pattern: Extension has `"tabs"` permission but only needs current tab access on user gesture
- Check: `"permissions"` contains `"tabs"` without corresponding background logic that lists all tabs
- Risk: `tabs` permission exposes URL and title of all open tabs; unnecessary data access
- Remediation: Replace `"tabs"` with `"activeTab"` where possible; `activeTab` grants temporary access only on user action

**Background Page Instead of Service Worker (V3)**
- Pattern (V3): `"background"\s*:\s*\{.*"page"` instead of `"service_worker"`
- Risk: Persistent background pages consume memory and have broader runtime capabilities
- Remediation: Use `"background": { "service_worker": "sw.js" }` in Manifest V3

### Low

**Unused Permissions Declared**
- Check: Permissions in manifest that are never referenced in extension code
- Pattern: `"permissions"` entries with no corresponding `chrome.<api>` usage in any JS file
- Risk: Violates principle of least privilege; increases review burden for store approval
- Remediation: Audit and remove all permissions not actively used in code

---

## Content Scripts

### Critical

**eval() or new Function() in Content Scripts**
- Pattern: `eval\s*\(|new\s+Function\s*\(` in files listed under `content_scripts` or injected via `executeScript`
- Risk: If attacker controls the input, arbitrary code runs in the page context with extension privileges
- Remediation: Never use `eval()` or `new Function()` in content scripts; use static code paths and data-driven logic

**DOM Manipulation with Unsanitized Data**
- Pattern: `\.innerHTML\s*=|\.outerHTML\s*=|\.insertAdjacentHTML\s*\(|document\.write\s*\(`
- Check: Whether the assigned value comes from extension messaging, storage, or external sources
- Risk: DOM-based XSS if extension data or page data is injected without sanitization
- Remediation: Use `textContent` for text; use `createElement` + `setAttribute` for elements; sanitize with DOMPurify if HTML is required

### High

**Content Script Accessing Sensitive Page Data**
- Pattern: `document\.querySelector\(.*password|\.value.*password|getElement.*token|\.cookie`
- Pattern: `document\.forms|\.querySelectorAll\(.*input\[type.*password`
- Risk: Content script reads passwords, session tokens, or cookies from the host page
- Remediation: Only access page DOM elements strictly required for functionality; never exfiltrate credentials

**Message Passing Without Origin Verification**
- Pattern: `chrome\.runtime\.onMessage\.addListener\s*\(\s*function\s*\(\s*message` without checking `sender.origin` or `sender.url`
- Pattern: `window\.addEventListener\s*\(\s*['"]message['"]` without checking `event.origin`
- Risk: Malicious pages or other extensions can send spoofed messages to the content script
- Remediation: Always validate `sender.id`, `sender.origin`, or `sender.url` before processing messages

### Medium

**Broad CSS Injection**
- Pattern: `"content_scripts".*"css"\s*:\s*\[` combined with broad match patterns
- Risk: CSS injection on all pages can hide security warnings, overlay fake UI, or modify page behavior via `content: url()` and pointer-events manipulation
- Remediation: Limit CSS injection to required domains; use unique class prefixes to avoid conflicts

**Content Script Using postMessage Without Target Origin**
- Pattern: `\.postMessage\s*\(.*,\s*['\"]\*['\"]`
- Risk: Messages sent to `"*"` are received by any frame, potentially leaking data to malicious iframes
- Remediation: Always specify an explicit target origin in `postMessage` calls

---

## Background / Service Worker

### Critical

**Message Handling Without Sender Verification**
- Pattern: `chrome\.runtime\.onMessage\.addListener` where callback does not check `sender.tab`, `sender.id`, or `sender.origin`
- Pattern: `chrome\.runtime\.onMessageExternal\.addListener` without origin validation
- Risk: Any extension or web page (via `externally_connectable`) can trigger background script actions
- Remediation: Validate `sender.id` against the extension's own ID; for external messages, validate against an allowlist of origins

**Dynamic Code Execution from User Input**
- Pattern: `chrome\.scripting\.executeScript\s*\(.*\bfunc\b.*\b(message|request|input|data|url)\b`
- Pattern: `chrome\.tabs\.executeScript\s*\(.*\bcode\s*:`
- Risk: If the executed code is derived from user-controlled data, attacker achieves arbitrary script execution in any tab
- Remediation: Never build script code from dynamic input; use static functions with parameterized data

### High

**Sensitive Data in chrome.storage.local (Unencrypted)**
- Pattern: `chrome\.storage\.local\.set\s*\(.*token|password|secret|apiKey|api_key|credential`
- Risk: `chrome.storage.local` is stored unencrypted on disk; malware or physical access can read it
- Remediation: Encrypt sensitive values before storing; consider using `chrome.identity` for OAuth flows instead of storing tokens manually

**Secrets Synced via chrome.storage.sync**
- Pattern: `chrome\.storage\.sync\.set\s*\(.*token|password|secret|apiKey|api_key`
- Risk: Data in `storage.sync` is uploaded to the user's cloud account and synced across devices, increasing exposure
- Remediation: Never store secrets in `storage.sync`; use `storage.session` (V3) for ephemeral secrets that clear on browser close

**Unrestricted Native Messaging**
- Pattern: `chrome\.runtime\.connectNative\s*\(|chrome\.runtime\.sendNativeMessage\s*\(`
- Check: Whether native host validates message content and source
- Risk: Compromised extension sends arbitrary commands to native application with OS-level access
- Remediation: Validate and sanitize all messages in the native host; restrict the native host to expected message schemas

### Medium

**Using Alarms or setTimeout for Sensitive Operations**
- Pattern: `chrome\.alarms\.create\s*\(.*\{.*periodInMinutes` combined with data exfiltration patterns
- Risk: Periodic background tasks may silently transmit collected data
- Remediation: Audit all alarm and timer callbacks; ensure periodic tasks are justified and documented

---

## Network & Data Handling

### Critical

**Intercepting and Modifying All Web Requests**
- Pattern: `chrome\.webRequest\.onBeforeRequest\.addListener\s*\(.*\{.*urls\s*:\s*\[.*<all_urls>`
- Pattern: `chrome\.webRequest\.onBeforeSendHeaders\.addListener` with header modification
- Risk: Extension can silently read, redirect, or modify all HTTP traffic including authentication headers
- Remediation: Limit `webRequest` URL filters to specific domains; in V3, use `declarativeNetRequest` with explicit rules

**Sending Browsing Data to External Servers**
- Pattern: `fetch\s*\(|XMLHttpRequest|\.ajax\s*\(` in background script combined with `chrome\.tabs\.onUpdated|chrome\.webNavigation|chrome\.history`
- Pattern: Request bodies containing `url`, `title`, `tab`, or `page` variables
- Risk: Silent exfiltration of full browsing history to third-party servers
- Remediation: Only send data to extension's own backend with user consent; disclose data collection in privacy policy

### High

**Modifying Authentication Headers on Third-Party Requests**
- Pattern: `onBeforeSendHeaders.*requestHeaders.*Authorization|Cookie|X-Auth`
- Pattern: Adding or modifying `Authorization` headers in `webRequest` callbacks
- Risk: Leaking user auth tokens to unintended third-party domains
- Remediation: Only modify headers for requests to the extension's own API domain

**HTTP Used for Extension API Calls**
- Pattern: `fetch\s*\(\s*['"]http://|XMLHttpRequest.*open\s*\(\s*['"][A-Z]+['"]\s*,\s*['"]http://`
- Risk: Extension API calls over HTTP are vulnerable to MITM; credentials and user data transmitted in cleartext
- Remediation: Always use HTTPS for all external requests; reject insecure schemes

### Medium

**URL/Page Content Logging**
- Pattern: `chrome\.tabs\.onUpdated.*url|chrome\.webNavigation\.onCompleted` with logging or storage calls
- Pattern: `document\.documentElement\.outerHTML|document\.body\.innerText` sent via message passing
- Risk: Collecting page content or URLs without user knowledge; privacy violation
- Remediation: Minimize data collection; only gather what is necessary; disclose in privacy policy

---

## Popup & Options Pages

### Critical

**XSS in Extension Pages**
- Pattern: `\.innerHTML\s*=` in `popup.js`, `options.js`, or related extension page scripts
- Pattern: `document\.write\s*\(` in popup or options pages
- Check: Whether the value assigned comes from `chrome.storage`, message passing, or URL parameters
- Risk: If attacker can influence stored data or messages, XSS executes in the extension's privileged context
- Remediation: Use `textContent` for text rendering; use templating with auto-escaping; sanitize all dynamic HTML

### High

**Loading Remote Scripts in Extension Pages**
- Pattern: `<script\s+src\s*=\s*["']https?://` in `popup.html`, `options.html`, or any extension HTML
- Risk: Remote scripts can be modified server-side to inject malicious code into the extension's privileged context
- Note: Manifest V3 blocks remote code by default; V2 allows it unless CSP restricts it
- Remediation: Bundle all scripts locally; never load scripts from external CDNs or servers

**Missing CSP for Extension Pages (V2)**
- Pattern (V2): No `"content_security_policy"` key in manifest.json
- Risk: Default V2 CSP allows `eval()` and some inline patterns; attackers can exploit this
- Remediation: Explicitly set `"content_security_policy": "script-src 'self'; object-src 'self'"`

### Medium

**Form Data Handling Without Sanitization in Options Page**
- Pattern: `document\.getElementById\(.*\.value` stored directly to `chrome.storage` without validation
- Risk: Stored XSS if the value is later rendered unsafely; injection if passed to native messaging or APIs
- Remediation: Validate and sanitize all user input from options forms before storage or use

---

## General Extension Security

### Critical

**Hardcoded Secrets in Extension Source**
- Pattern: `['"][A-Za-z0-9_]{20,}['"]` near `apiKey|api_key|secret|token|password|client_secret`
- Pattern: `AIza[0-9A-Za-z_-]{35}` (Google API key)
- Pattern: `sk-[a-zA-Z0-9]{32,}` (OpenAI key)
- Risk: Extension source code is fully readable after installation (via browser DevTools or unpacking .crx); all secrets are exposed
- Remediation: Use a backend proxy for API calls; never embed secrets in extension code; use OAuth flows via `chrome.identity`

### High

**Bundled Third-Party Libraries with Known Vulnerabilities**
- Check: Version of bundled jQuery, lodash, moment.js, or other libraries against known CVE databases
- Pattern: `jquery[-.](\d+\.\d+\.\d+)` or version strings in library headers
- Risk: Vulnerable libraries in extension context can be exploited by malicious page content
- Remediation: Keep dependencies updated; use `npm audit` or `retire.js` on the extension bundle; prefer browser-native APIs

**Missing Update Mechanism Security**
- Check: Extensions with self-update logic outside of the browser store
- Pattern: `fetch.*\.crx|\.xpi|update_url` in background scripts
- Risk: Self-updating extensions can be hijacked via MITM to deliver malicious updates
- Remediation: Distribute only through official browser stores; never implement custom update mechanisms

### Medium

**Excessive Data Collection Without Disclosure**
- Check: Extension collects browsing history, form data, or page content without a visible privacy policy
- Pattern: `"permissions"` includes `"history"`, `"bookmarks"`, or `"topSites"` without corresponding `privacy_policy` in store listing
- Risk: Regulatory violations (GDPR, CCPA); user trust erosion; store rejection
- Remediation: Publish a clear privacy policy; minimize data collection; add user consent flows

**Side-Loading Risks (Enterprise/Developer)**
- Check: Extension loaded via `--load-extension`, registry keys, or enterprise policy without code review
- Pattern: `ExtensionInstallForcelist|ExtensionInstallSources` in group policy or registry
- Risk: Side-loaded extensions bypass store security review; malicious extensions can be silently installed
- Remediation: Review side-loaded extensions with same rigor as store submissions; use allowlists in enterprise policies

### Low

**Missing Privacy Policy for Data-Handling Extensions**
- Check: Extension requests any data-related permissions but has no privacy policy URL in manifest or store listing
- Risk: Store rejection; user distrust; regulatory non-compliance
- Remediation: Add `"homepage_url"` or store listing link to a published privacy policy

**No Permissions Justification Documentation**
- Check: No comments in manifest or documentation explaining why each permission is needed
- Risk: Delays store review; makes security audits harder; permissions may be unnecessarily broad
- Remediation: Add comments or a PERMISSIONS.md documenting the purpose of each requested permission

---

## Detection Quick Reference

```
# --- Manifest checks ---
# Broad host permissions
grep -P '"<all_urls>"|\*://\*/\*' manifest.json

# Manifest V2
grep -P '"manifest_version"\s*:\s*2' manifest.json

# Dangerous permissions
grep -P '"(debugger|management|nativeMessaging|webRequestBlocking|proxy|vpnProvider)"' manifest.json

# Permissive CSP
grep -P 'unsafe-eval|unsafe-inline' manifest.json

# Externally connectable wildcards
grep -P '"externally_connectable"' manifest.json

# --- JavaScript checks ---
# eval or new Function in any JS
grep -rP 'eval\s*\(|new\s+Function\s*\(' --include="*.js"

# innerHTML assignment
grep -rP '\.innerHTML\s*=' --include="*.js"

# Unsanitized message listeners
grep -rP 'onMessage\.addListener|onMessageExternal\.addListener' --include="*.js"

# Sensitive storage operations
grep -rP 'storage\.(local|sync)\.set.*\b(token|password|secret|apiKey)\b' --include="*.js"

# HTTP API calls
grep -rP "fetch\s*\(\s*['\"]http://" --include="*.js"

# Hardcoded API keys
grep -rP '(apiKey|api_key|secret|token)\s*[:=]\s*["\x27][A-Za-z0-9_-]{16,}' --include="*.js"

# Remote script loading in HTML
grep -rP '<script\s+src\s*=\s*["\x27]https?://' --include="*.html"

# postMessage to wildcard origin
grep -rP "postMessage\s*\(.*,\s*['\"]\\*['\"]" --include="*.js"

# Native messaging calls
grep -rP 'connectNative|sendNativeMessage' --include="*.js"

# Dynamic script execution
grep -rP 'executeScript.*code\s*:' --include="*.js"
```
