# Electron & Desktop Application Security Checks

Reference file for Electron, Tauri, and general desktop application security patterns. Covers renderer isolation, IPC security, auto-update integrity, protocol handlers, and platform-specific hardening.

---

## Electron Security

### Critical

**nodeIntegration Enabled in BrowserWindow**
- Pattern: `nodeIntegration\s*:\s*true`
- Pattern: `new\s+BrowserWindow\s*\(\s*\{[^}]*nodeIntegration\s*:\s*true`
- Risk: Grants the renderer process full Node.js access; any XSS vulnerability immediately escalates to remote code execution (file system access, child_process, etc.)
- Remediation: Set `nodeIntegration: false` (default since Electron 5). Use `contextBridge` in the preload script to expose only the specific APIs the renderer needs.

**contextIsolation Disabled**
- Pattern: `contextIsolation\s*:\s*false`
- Risk: Without context isolation, the preload script shares a JavaScript context with the renderer page. A malicious page or injected script can modify prototypes and built-in objects to intercept preload-exposed APIs, leading to privilege escalation.
- Remediation: Set `contextIsolation: true` (default since Electron 12). Always use `contextBridge.exposeInMainWorld()` to expose APIs safely.

**Remote Module Enabled**
- Pattern: `enableRemoteModule\s*:\s*true`
- Pattern: `require\s*\(\s*['"]@electron/remote['"]\s*\)`
- Risk: The remote module exposes full main-process objects to the renderer via synchronous IPC. Any XSS in the renderer can call `require('child_process').exec()` via the remote module, achieving RCE.
- Remediation: Remove `@electron/remote` entirely. Use explicit `ipcMain.handle()` / `ipcRenderer.invoke()` for any main-process operations the renderer needs.

**webSecurity Disabled**
- Pattern: `webSecurity\s*:\s*false`
- Risk: Disables same-origin policy and CORS enforcement in the renderer. Allows loading arbitrary local files via `file://` and bypassing cross-origin restrictions. Commonly misused during development and left in production.
- Remediation: Remove `webSecurity: false`. Fix CORS issues server-side or use Electron's `session.webRequest` API to modify headers.

**allowRunningInsecureContent Enabled**
- Pattern: `allowRunningInsecureContent\s*:\s*true`
- Risk: Allows an HTTPS page to load and execute scripts over HTTP. Enables MITM injection of malicious scripts into the renderer.
- Remediation: Set `allowRunningInsecureContent: false`. Ensure all resources are served over HTTPS.

**Loading Remote Content Without Restrictions**
- Pattern: `loadURL\s*\(\s*['"]https?://` without corresponding CSP
- Pattern: `mainWindow\.loadURL\s*\(.*(?:http|https)` in main process
- Risk: Loading remote web content in a BrowserWindow with elevated privileges turns any XSS on the remote site into RCE on the user's machine.
- Remediation: Load remote content in a `<webview>` tag or `BrowserView` with `nodeIntegration: false`, `sandbox: true`, and strict CSP. Prefer loading local content via `loadFile()`.

### High

**shell.openExternal With User-Controlled URLs**
- Pattern: `shell\.openExternal\s*\(`
- Pattern: `shell\.openExternal\s*\(\s*(?:url|link|href|data|input|arg|param|req)`
- Risk: If the URL argument is user-controlled, attackers can execute arbitrary commands via protocol handlers (e.g., `file:///`, `smb://`, or custom protocol schemes that launch applications).
- Remediation: Validate URLs with an allowlist of permitted protocols (`https://` only). Sanitize input: `if (url.startsWith('https://')) { shell.openExternal(url); }`

**Insecure IPC Handlers (No Input Validation)**
- Pattern: `ipcMain\.on\s*\(\s*['"][^'"]+['"]\s*,\s*(?:async\s+)?\(\s*event\s*,\s*[^)]+\)\s*=>`
- Pattern: `ipcMain\.handle\s*\(` without subsequent input validation
- Check: Look for `ipcMain.on` or `ipcMain.handle` callbacks that pass arguments directly to `fs`, `child_process`, `exec`, `spawn`, `eval`, `require`, or database queries
- Risk: Renderer can send arbitrary data through IPC channels. Without validation, this enables path traversal, command injection, and SQL injection from a compromised renderer.
- Remediation: Validate and sanitize all IPC arguments in the main process. Use schema validation (e.g., zod). Treat IPC input as untrusted.

**Sandbox Not Enabled**
- Pattern: `sandbox\s*:\s*false`
- Pattern: `new\s+BrowserWindow\s*\(` without `sandbox: true` in webPreferences
- Risk: Without sandboxing, the renderer process has broader OS-level access. A compromised renderer can interact with the filesystem and OS APIs more freely.
- Remediation: Set `sandbox: true` in webPreferences. In Electron 20+, the sandbox is enabled by default; ensure it is not explicitly disabled.

**Insecure Custom Protocol Handlers**
- Pattern: `protocol\.registerHttpProtocol|protocol\.registerFileProtocol|protocol\.registerBufferProtocol|protocol\.registerStringProtocol`
- Pattern: `protocol\.handle\s*\(`
- Check: Ensure registered protocol handlers validate the requested path and do not allow path traversal
- Risk: Custom protocol handlers (e.g., `myapp://`) that serve file content without path validation enable local file read vulnerabilities. Attackers can craft URLs like `myapp://../../etc/passwd`.
- Remediation: Validate and normalize paths in protocol handlers. Use an allowlist of permitted directories. Reject paths containing `..` or absolute paths outside the app directory.

**Deep Link Handling Without Validation**
- Pattern: `app\.setAsDefaultProtocolClient\s*\(`
- Pattern: `open-url|second-instance`
- Pattern: `process\.argv` used for URL routing
- Risk: Deep links (e.g., `myapp://action?param=value`) can be triggered by websites or other apps. Without validation, attackers can invoke privileged actions, inject arguments, or trigger navigation to malicious content.
- Remediation: Parse deep link URLs with a URL parser. Validate the scheme, host, path, and all parameters. Use an allowlist of permitted actions.

**Permissions Not Restricted**
- Pattern: `setPermissionRequestHandler` absent in main process
- Pattern: `setPermissionCheckHandler` absent in main process
- Risk: By default, Electron grants all permission requests (camera, microphone, geolocation, notifications, media key access). A compromised renderer or loaded remote content can access these without user consent.
- Remediation: Implement `ses.setPermissionRequestHandler()` to explicitly approve or deny each permission type. Deny all by default and allowlist only required permissions.

**CSP Not Set for Renderer**
- Pattern: `Content-Security-Policy` absent in HTML meta tags and response headers
- Pattern: `<meta\s+http-equiv=["']Content-Security-Policy["']` absent in loaded HTML
- Check: Also verify CSP via `session.webRequest.onHeadersReceived` if set programmatically
- Risk: Without CSP, injected scripts execute freely in the renderer. Combined with elevated privileges, this enables full system compromise.
- Remediation: Set a strict CSP in the HTML or via response headers: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`. Avoid `unsafe-eval`.

**Auto-Update Without Signature Verification**
- Pattern: `autoUpdater\.setFeedURL\s*\(\s*['"]http://` (HTTP, not HTTPS)
- Pattern: `autoUpdater` usage without code signing configured
- Pattern: `electron-updater|update-electron-app|autoUpdater` without signature verification
- Risk: MITM attack on the update channel can deliver a malicious binary to all users. If the update feed URL uses HTTP or the update package is not cryptographically signed, attackers can replace the update with malware.
- Remediation: Always use HTTPS for update feeds. Enable code signing for all platforms. For `electron-updater`, ensure `publisherName` is set and signatures are verified.

### Medium

**Preload Script Exposes Too Many APIs**
- Pattern: `contextBridge\.exposeInMainWorld\s*\(\s*['"][^'"]+['"]\s*,\s*\{` with many methods
- Pattern: `exposeInMainWorld.*\{[^}]{500,}\}` (large API surface)
- Check: Count the number of methods exposed via `contextBridge`; flag if more than 10
- Risk: Each exposed API is an attack surface for a compromised renderer. Exposing broad capabilities (filesystem access, shell commands, database operations) through the bridge negates the benefit of context isolation.
- Remediation: Apply the principle of least privilege. Expose only the minimal set of narrowly-scoped functions. Never expose generic wrappers like `invoke(channel, ...args)` that forward arbitrary IPC calls.

**Dangerous Electron Fuses Not Configured**
- Pattern: Absence of `@electron/fuses` in build configuration
- Pattern: `FuseV1Options` not found in build scripts
- Check for: `RunAsNode`, `EnableCookieEncryption`, `EnableNodeOptionsEnvironmentVariable`, `EnableNodeCliInspectArguments`, `EnableEmbeddedAsarIntegrityValidation`, `OnlyLoadAppFromAsar`
- Risk: Without disabling `RunAsNode`, the application binary can be abused as a full Node.js runtime by setting `ELECTRON_RUN_AS_NODE=1`. Without `OnlyLoadAppFromAsar`, an attacker can replace app code with a modified directory.
- Remediation: Use `@electron/fuses` to flip critical fuses at build time:
  ```
  RunAsNode: false
  EnableNodeOptionsEnvironmentVariable: false
  EnableNodeCliInspectArguments: false
  EnableEmbeddedAsarIntegrityValidation: true
  OnlyLoadAppFromAsar: true
  ```

**Using file:// Protocol for Content Loading**
- Pattern: `loadURL\s*\(\s*['"]file://`
- Pattern: `src\s*=\s*['"]file://`
- Risk: `file://` URLs have broad local filesystem access. If combined with an XSS vulnerability, the attacker can read arbitrary files on the user's system. Also susceptible to path traversal.
- Remediation: Use a custom protocol with restricted scope via `protocol.handle()`. For local content, prefer `loadFile()` which is relative to the app directory.

**DevTools Exposed in Production**
- Pattern: `openDevTools\s*\(` without conditional check for development mode
- Pattern: `webContents\.openDevTools` in production code
- Check: Verify that DevTools are gated behind `process.env.NODE_ENV === 'development'` or `app.isPackaged`
- Risk: Open DevTools allow users (or attackers with local access) to execute arbitrary JavaScript in the renderer, inspect IPC traffic, and modify application state.
- Remediation: Disable DevTools in production: `if (app.isPackaged) { win.webContents.on('devtools-opened', () => win.webContents.closeDevTools()); }`

**Insecure webview Tag Usage**
- Pattern: `<webview\s+` in HTML files
- Pattern: `allowpopups|disablewebsecurity|nodeintegration` attributes on webview tags
- Risk: The `<webview>` tag can load untrusted content. If `nodeintegration` is set as an attribute, or `allowpopups` is enabled, the embedded content gains elevated privileges.
- Remediation: Prefer `BrowserView` or `iframe` with sandboxing. If using `<webview>`, never set `nodeintegration`, `disablewebsecurity`, or `allowpopups`. Validate the `src` attribute.

### Low

**No Explicit Navigate/Open Handler**
- Pattern: Absence of `will-navigate` event listener on webContents
- Pattern: Absence of `setWindowOpenHandler` on webContents
- Risk: Without these handlers, the renderer can navigate to arbitrary URLs or open new windows with elevated privileges.
- Remediation: Add `webContents.on('will-navigate', ...)` to validate navigation targets. Add `webContents.setWindowOpenHandler()` to control new window creation.

**Electron Version Outdated**
- Pattern: `"electron"\s*:\s*"[^"]*"` in package.json — check against latest stable
- Risk: Older Electron versions may contain known Chromium and Node.js CVEs.
- Remediation: Keep Electron updated. Subscribe to Electron security advisories. Use Dependabot or Renovate for automated updates.

---

## Tauri Security

### Critical

**Shell Command Injection via Invoke**
- Pattern: `Command::new\s*\(.*(?:arg|param|input|user|req)` in Rust backend
- Pattern: `tauri::api::process::Command` with unsanitized arguments
- Pattern: `shell\s*:\s*\{[^}]*execute\s*:\s*true` in tauri.conf.json
- Risk: If Tauri commands pass user-controlled input to shell commands without validation, attackers can inject arbitrary OS commands via the frontend.
- Remediation: Never interpolate user input into shell commands. Use parameterized command arguments. Validate and sanitize all inputs in command handlers.

**dangerousRemoteDomainIpcAccess Enabled**
- Pattern: `dangerousRemoteDomainIpcAccess`
- Pattern: `"dangerousRemoteDomainIpcAccess"\s*:\s*\[`
- Risk: Allows remote domains to invoke Tauri IPC commands. A compromised or malicious remote site loaded in the webview can call any allowed Tauri command, accessing the filesystem, shell, and other system APIs.
- Remediation: Remove `dangerousRemoteDomainIpcAccess` unless absolutely required. If needed, restrict to the minimum set of domains and commands.

### High

**Allowlist Too Broad**
- Pattern: `"all"\s*:\s*true` in tauri.conf.json allowlist
- Pattern: `allowlist.*"all"\s*:\s*true`
- Pattern: `"fs"\s*:\s*\{\s*"all"\s*:\s*true|"shell"\s*:\s*\{\s*"all"\s*:\s*true|"http"\s*:\s*\{\s*"all"\s*:\s*true`
- Risk: Granting `all: true` at the top level or within a module (fs, shell, http) exposes every API in that category to the frontend. A single XSS vulnerability can then read/write arbitrary files, execute commands, or make unrestricted network requests.
- Remediation: Enable only the specific APIs needed. For example, use `"readFile": true` instead of `"fs": { "all": true }`. Apply scope restrictions.

**Missing Scope Restrictions on fs/shell/http APIs**
- Pattern: `"scope"\s*:\s*\[\s*"\*\*"` or absence of `scope` in fs/shell/http config
- Pattern: `"fs"\s*:\s*\{[^}]*}` without `"scope"` key
- Risk: Without scopes, filesystem APIs can access any path, shell APIs can execute any command, and HTTP APIs can reach any URL. This removes all sandboxing benefits.
- Remediation: Define restrictive scopes:
  - fs: `"scope": ["$APPDATA/**", "$RESOURCE/**"]`
  - shell: `"scope": [{ "name": "mycommand", "cmd": "/usr/bin/specific", "args": true }]`
  - http: `"scope": ["https://api.myapp.com/*"]`

**Missing CSP in tauri.conf.json**
- Pattern: `"csp"` absent in `tauri.conf.json` security section
- Pattern: `"security"\s*:\s*\{[^}]*}` without `"csp"` key
- Risk: Without CSP, the Tauri webview allows inline scripts and loading from any origin, enabling XSS attacks.
- Remediation: Set a strict CSP in `tauri.conf.json`: `"csp": "default-src 'self'; script-src 'self'"`

### Medium

**Insecure IPC Command Handlers**
- Pattern: `#\[tauri::command\]` functions without input validation
- Pattern: `tauri::command` handlers that accept `String` or generic types without validation
- Check: Verify that command parameters are validated before use in file operations, database queries, or shell invocations
- Risk: Tauri commands are callable from the frontend. Without validation, they become injection vectors for path traversal, SQL injection, and command injection.
- Remediation: Validate all command parameters in Rust. Use strong typing (enums, newtypes) rather than raw strings. Return errors for invalid input.

**Unrestricted Event Listeners**
- Pattern: `app\.listen_global|window\.listen` with broad event names
- Risk: Events are a secondary IPC mechanism in Tauri. Overly broad listeners may process untrusted data from the frontend.
- Remediation: Validate event payloads. Use specific event names rather than wildcards.

### Low

**Development-Only Features in Production Build**
- Pattern: `devtools` or `"devPath"` referencing localhost in production config
- Pattern: `#[cfg(debug_assertions)]` guards absent on development-only code
- Risk: Development features (DevTools, hot reload, debug logging) in production builds expose internal state and may weaken security.
- Remediation: Gate development features behind `#[cfg(debug_assertions)]`. Verify `tauri.conf.json` uses `distDir` (not `devPath`) for production.

---

## General Desktop Application Security

### Critical

**Hardcoded Secrets in Binary**
- Pattern: `(?:api[_-]?key|secret|password|token|credential|private[_-]?key)\s*[:=]\s*["'][A-Za-z0-9+/=_-]{16,}["']`
- Pattern: `-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----`
- Pattern: `AKIA[0-9A-Z]{16}` (AWS access key)
- Risk: Secrets embedded in compiled binaries can be extracted with basic reverse engineering tools (strings, hex editors, decompilers). Attackers gain access to backend services, APIs, and infrastructure.
- Remediation: Store secrets server-side. Use OS-native credential stores (Keychain, Windows Credential Manager, libsecret). Fetch tokens at runtime via authenticated API calls.

**Insecure Auto-Update Mechanism**
- Pattern: Update URL using `http://` instead of `https://`
- Pattern: Custom update logic without signature verification
- Pattern: `request\s*\(\s*['"]http://.*update|fetch\s*\(\s*['"]http://.*update`
- Risk: Without TLS and signature verification, attackers can perform MITM attacks to serve malicious updates to all users. This is the highest-impact supply chain attack vector for desktop apps.
- Remediation: Use HTTPS for all update traffic. Cryptographically sign all update artifacts. Verify signatures before applying updates. Pin certificates if possible. Use established update frameworks (Squirrel, electron-updater with signing, Tauri updater with signature).

### High

**Local Storage of Sensitive Data Without Encryption**
- Pattern: `localStorage\.setItem\s*\(\s*['"](?:token|session|password|secret|key|credential)`
- Pattern: `fs\.writeFileSync?\s*\(.*(?:token|password|secret|credential|key)`
- Pattern: `electron-store|conf|configstore` without encryption option
- Risk: Tokens, passwords, and session data stored in plaintext on disk can be read by any process running as the same user, or extracted from disk images and backups.
- Remediation: Use OS-native credential stores:
  - macOS: Keychain via `keytar` or `safeStorage`
  - Windows: Credential Manager / DPAPI via `keytar` or `safeStorage`
  - Linux: libsecret via `keytar` or `safeStorage`
  - Electron: Use `safeStorage.encryptString()` for at-rest encryption

**Missing Code Signing**
- Pattern: Absence of signing configuration in build scripts (electron-builder, Tauri, etc.)
- Pattern: `"win"\s*:\s*\{[^}]*}` without `"certificateFile"` or `"sign"` in electron-builder config
- Pattern: `"mac"\s*:\s*\{[^}]*}` without `"identity"` in electron-builder config
- Risk: Unsigned binaries trigger OS warnings (Gatekeeper, SmartScreen), reducing user trust. More critically, unsigned apps can be replaced by malicious versions without detection.
- Remediation: Sign all releases:
  - macOS: Apple Developer ID + notarization
  - Windows: EV code signing certificate + Microsoft SmartScreen reputation
  - Linux: GPG signatures for packages

**DLL Hijacking / Library Loading Vulnerabilities**
- Pattern: `LoadLibrary\s*\(|dlopen\s*\(|ctypes\.cdll|ffi\.Library`
- Pattern: Relative paths in library loading calls
- Pattern: `process\.env\.PATH` manipulation before library loading
- Risk: If the application loads DLLs/shared libraries from the current working directory, user-writable directories, or paths controlled by the attacker, a malicious library can be loaded instead. This is especially dangerous on Windows where DLL search order includes CWD.
- Remediation: Use absolute paths for all library loading. On Windows, call `SetDllDirectory("")` to remove CWD from the search path. Use `SetDefaultDllDirectories(LOAD_LIBRARY_SEARCH_SYSTEM32)`.

### Medium

**Insecure Inter-Process Communication**
- Pattern: Named pipes or Unix sockets without authentication
- Pattern: `net\.createServer\s*\(` for IPC without access controls
- Pattern: `localhost:\d+` HTTP servers for IPC without authentication
- Risk: Local IPC endpoints (named pipes, sockets, localhost HTTP servers) without authentication allow other processes on the same machine to send commands to the application, potentially performing privileged operations.
- Remediation: Authenticate IPC connections using tokens, process ID verification, or OS-level access controls. Restrict named pipe / socket permissions. Do not use unauthenticated localhost HTTP for IPC.

**Registry / plist Manipulation Risks**
- Pattern (Windows): `reg\.exe|RegSetValueEx|RegCreateKeyEx|HKEY_CURRENT_USER|HKEY_LOCAL_MACHINE`
- Pattern (macOS): `defaults\s+write|CFPreferences|NSUserDefaults`
- Pattern: `regedit|electron-store.*registry`
- Risk: Storing security-sensitive configuration in the Windows registry or macOS plist without integrity checks allows local attackers to modify application behavior (e.g., changing update URLs, disabling security features, altering file paths).
- Remediation: Do not store security-critical values in registry/plist. If necessary, sign or MAC the stored configuration and validate on read.

**Insecure Temporary File Usage**
- Pattern: `tmpdir|temp|os\.tmpdir\(\)|mktemp` with predictable filenames
- Pattern: `fs\.writeFileSync?\s*\(\s*(?:path\.join\s*\(\s*os\.tmpdir|\/tmp\/|%TEMP%)`
- Risk: Predictable temporary file paths enable symlink attacks, race conditions (TOCTOU), and information disclosure. Another process can create a symlink at the expected temp path pointing to a sensitive file.
- Remediation: Use `mkdtemp` for temporary directories. Use random, unpredictable filenames. Set restrictive permissions on temp files (0600).

**Cleartext Logging of Sensitive Data**
- Pattern: `console\.log\s*\(.*(?:password|token|secret|key|credential|session)`
- Pattern: `log\.(?:info|debug|warn|error)\s*\(.*(?:password|token|secret|key|auth)`
- Risk: Desktop application logs are stored on disk and often accessible by any local process. Logging tokens, passwords, or API keys creates a persistent credential exposure.
- Remediation: Redact sensitive fields before logging. Use structured logging with an explicit denylist of sensitive field names.

### Low

**Excessive File System Permissions**
- Pattern: `fs\.chmod.*0o?777|chmod\s+777|0777`
- Pattern: `fs\.writeFile` without explicit mode parameter
- Risk: Creating files with world-readable/writable permissions allows other users on shared systems to access or modify application data.
- Remediation: Set restrictive permissions (0600 for sensitive files, 0700 for directories). Use `{ mode: 0o600 }` in Node.js `fs` calls.

**Missing Process Sandboxing**
- Pattern: Absence of macOS `entitlements.plist` with `app-sandbox`
- Pattern: Absence of AppArmor / SELinux profiles for Linux packages
- Risk: Without OS-level sandboxing, a compromised application has full access to user-level resources.
- Remediation: Enable the macOS App Sandbox via entitlements. Create AppArmor profiles for Linux packages. Use Windows AppContainer if distributing via MSIX.

**Unvalidated Clipboard Access**
- Pattern: `clipboard\.readText|clipboard\.writeText|navigator\.clipboard`
- Risk: Reading clipboard contents can expose passwords from password managers. Writing to the clipboard can replace copied cryptocurrency addresses or other sensitive data.
- Remediation: Only access the clipboard in response to explicit user actions. Clear sensitive clipboard data after a timeout. Inform the user when clipboard content is read.

---

## Detection Patterns Summary

Quick-reference patterns for automated scanning:

```
# Electron Critical
nodeIntegration\s*:\s*true
contextIsolation\s*:\s*false
enableRemoteModule\s*:\s*true
webSecurity\s*:\s*false
allowRunningInsecureContent\s*:\s*true

# Electron High
shell\.openExternal\s*\(
ipcMain\.(on|handle)\s*\(
sandbox\s*:\s*false
protocol\.register(File|Buffer|String|Http)Protocol
app\.setAsDefaultProtocolClient\s*\(

# Electron Medium
contextBridge\.exposeInMainWorld
openDevTools\s*\(
<webview\s+

# Tauri Critical
dangerousRemoteDomainIpcAccess
Command::new\s*\(.*(?:input|param|arg)

# Tauri High
"all"\s*:\s*true
"scope"\s*:\s*\[\s*"\*\*"

# General Desktop
(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][A-Za-z0-9+/=_-]{16,}["']
LoadLibrary\s*\(|dlopen\s*\(
http://.*update
localStorage\.setItem\s*\(.*(?:token|password|secret)
```

---

## Remediation Priority

1. **Immediate** (Critical): Disable `nodeIntegration`, enable `contextIsolation`, remove remote module, fix `webSecurity`, remove `dangerousRemoteDomainIpcAccess`, remove hardcoded secrets, secure auto-update with HTTPS + signatures.
2. **Next sprint** (High): Validate all IPC inputs, restrict permissions, enable sandbox, add CSP, restrict Tauri allowlist scopes, implement code signing, use OS credential stores, fix DLL loading.
3. **Planned** (Medium): Harden preload bridge surface, configure Electron fuses, secure IPC between processes, protect registry/plist values, fix temp file usage, redact logs.
4. **Backlog** (Low): Add navigation handlers, update Electron version, tighten file permissions, enable OS sandbox, audit clipboard access.
