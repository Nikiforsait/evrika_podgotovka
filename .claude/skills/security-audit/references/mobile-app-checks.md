# Mobile Application Security Checks

Reference file for mobile app security across React Native, Flutter, Expo, Swift/SwiftUI, Kotlin/Jetpack Compose, and Capacitor/Ionic. Covers hardcoded secrets, insecure storage, network security, WebView risks, platform-specific issues, and API communication.

---

## Cross-Platform: Hardcoded Secrets & Storage

### Critical

**API Keys / Secrets Hardcoded in Source**
- Pattern (React Native): `(api[_-]?key|api[_-]?secret|auth[_-]?token)\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]`
- Pattern (Flutter): `const\s+\w*(key|secret|token|password)\w*\s*=\s*['"][^'"]{8,}['"]`
- Pattern (Expo): `extra\s*:\s*\{[^}]*(apiKey|secret|token)\s*:\s*['"][^'"]+['"]`
- Pattern (env embedded): `REACT_NATIVE_.*SECRET|EXPO_PUBLIC_.*KEY|FLUTTER_.*TOKEN`
- Risk: Keys are extractable from APK (dex/smali) and IPA (Mach-O) binaries via `strings`, `jadx`, or `class-dump`
- Remediation: Store secrets server-side; use environment-based config that is excluded from bundles; use runtime secret fetching via authenticated endpoints

**Sensitive Data in AsyncStorage / SharedPreferences (Unencrypted)**
- Pattern (React Native): `AsyncStorage\.(setItem|multiSet)\s*\(\s*['"](?i)(token|password|secret|session|credit|ssn|auth)`
- Pattern (Flutter): `SharedPreferences\).*\.set(String|Int)\s*\(\s*['"](?i)(token|password|secret|auth)`
- Pattern (Expo): `SecureStore` not used — `AsyncStorage` used instead for sensitive values
- Risk: AsyncStorage is plaintext JSON on disk; SharedPreferences is plaintext XML; both readable on rooted/jailbroken devices and in device backups
- Remediation: Use `react-native-keychain`, `expo-secure-store`, or `flutter_secure_storage` for all sensitive values

### High

**Missing Certificate Pinning**
- Pattern (React Native): No `TrustKit`, `react-native-ssl-pinning`, or custom `fetch` pinning config
- Pattern (Flutter): No `SecurityContext` with `setTrustedCertificatesBytes` or `http_certificate_pinning`
- Pattern (generic): HTTP client created without pin verification — `axios\.create|fetch\(|http\.Client\(\)` without pinning wrapper
- Risk: MITM attacks on public Wi-Fi; proxy tools (Charles, mitmproxy) can intercept all traffic
- Remediation: Implement certificate pinning using platform-native or library-based approaches; pin to leaf or intermediate certificate hash

**Biometric Auth Bypass (Local-Only Verification)**
- Pattern (React Native): `TouchID\.authenticate|FingerprintScanner\.authenticate|LocalAuthentication\.authenticateAsync` without subsequent server token exchange
- Pattern (Flutter): `local_auth.*authenticate` used as sole gate without backend challenge
- Pattern: Biometric result stored as boolean flag — `(biometric|authenticated)\s*=\s*true`
- Risk: Attacker patches binary to skip local biometric check; no server-side proof of biometric auth
- Remediation: Use biometric auth to unlock a cryptographic key stored in Keychain/Keystore; send signed challenge to server for verification

### Medium

**Clipboard Leaking Sensitive Data**
- Pattern (React Native): `Clipboard\.setString\(.*(?i)(token|password|secret|ssn|card)`
- Pattern (Flutter): `Clipboard\.setData\(.*(?i)(token|password|secret)`
- Risk: Other apps can read clipboard; clipboard history persists on some OS versions
- Remediation: Avoid copying sensitive data to clipboard; if required, clear clipboard after short timeout

**Screenshots / Screen Recording Not Prevented**
- Pattern (React Native): No `FLAG_SECURE` set on Android — missing `getWindow\(\)\.setFlags\(.*FLAG_SECURE`
- Pattern (Flutter): No `FlutterWindowInfoListener` or `FLAG_SECURE` usage
- Pattern (iOS): No `UIScreen.didConnectNotification` observer for screen recording detection
- Risk: Sensitive screens (account details, OTP, card numbers) captured in screenshots or app switcher thumbnails
- Remediation: Set `FLAG_SECURE` on Android; use `UITextField.isSecureTextEntry` trick on iOS; blur content in `applicationWillResignActive`

**Push Notification Tokens Stored Insecurely**
- Pattern: `AsyncStorage\.setItem\(.*(?i)(fcm|apns|push|device).*token`
- Pattern: `SharedPreferences.*\.setString\(.*(?i)(fcm|push).*token`
- Risk: Push tokens can be used to send phishing notifications if extracted
- Remediation: Store push tokens server-side only; if local caching is needed, use encrypted storage

### Low

**Debug / Release Mode Detection Bypass**
- Pattern (React Native): `__DEV__` used as security gate — `if\s*\(\s*__DEV__\s*\)`
- Pattern (Flutter): `kDebugMode|kReleaseMode` used to toggle security features
- Risk: `__DEV__` and `kDebugMode` can be patched in bytecode; security should not depend on build mode flags alone
- Remediation: Use server-side feature flags for security controls; treat debug checks as convenience, not security boundaries

---

## Cross-Platform: WebView & Deep Links

### Critical

**Insecure WebView Configuration**
- Pattern (React Native): `<WebView[^>]*javaScriptEnabled\s*=\s*\{true\}[^>]*allowFileAccess\s*=\s*\{true\}`
- Pattern (React Native): `<WebView[^>]*originWhitelist\s*=\s*\{\['\*'\]\}`
- Pattern (Flutter): `WebView\(.*javascriptMode:\s*JavascriptMode\.unrestricted`
- Pattern: `onMessage|postMessage|addJavascriptChannel` with unvalidated origin
- Risk: Arbitrary JavaScript execution, local file access, cross-origin data theft
- Remediation: Disable JavaScript unless required; restrict `originWhitelist`; validate all `postMessage` origins; disable file access

### High

**Deep Link / Universal Link Hijacking**
- Pattern (React Native): `Linking\.addEventListener|useURL\(\)` without validating inbound URL scheme/host
- Pattern (Flutter): `uni_links|app_links` handler without URL validation
- Pattern: Deep link handler passes URL params directly to navigation — `navigate\(.*params\.url|params\.redirect`
- Risk: Malicious apps register same scheme; phishing via crafted deep links; open redirect within app
- Remediation: Validate all deep link parameters against allowlist; use Universal Links (iOS) / App Links (Android) with domain verification; never navigate to arbitrary URLs from deep links

**Expo OTA Updates Without Integrity Verification**
- Pattern: `expo-updates` configured without `codeSigningCertificate` or `codeSigningMetadata`
- Pattern (app.json): `"updates"\s*:\s*\{` without `"codeSigningCertificate"`
- Risk: Tampered OTA update can inject malicious code into production app without App Store review
- Remediation: Enable code signing for Expo updates; verify update integrity before applying; use `expo-updates` code signing feature

### Medium

**Expo Constants Leaking Device Information**
- Pattern: `Constants\.deviceId|Constants\.installationId|Constants\.sessionId`
- Pattern: `expo-constants` values logged or sent to analytics without filtering
- Risk: Persistent device fingerprinting; leaked device identifiers in analytics or crash reports
- Remediation: Avoid using deprecated `Constants.deviceId`; audit what device info is sent to third parties

---

## React Native Specific

### High

**Hermes Bytecode Reverse Engineering**
- Pattern: App uses Hermes without additional obfuscation — `hermes-engine` in `package.json` with no `react-native-obfuscating-transformer` or equivalent
- Risk: Hermes bytecode (`.hbc`) can be decompiled with `hbcdump` or `hermes-dec` revealing app logic, API routes, and business rules
- Remediation: Use JavaScript obfuscation before bundling; avoid embedding sensitive logic client-side; move business-critical logic to server

**React Native Bridge Security**
- Pattern: `NativeModules\.\w+\.\w+\(` with user-controlled arguments passed directly
- Pattern: Custom native modules without input validation — `@ReactMethod.*public void \w+\(.*String`
- Risk: Malicious JavaScript (via WebView or injection) can invoke native modules with arbitrary arguments
- Remediation: Validate all arguments in native module methods; restrict which native methods are exposed to JS; use allowlists for bridge calls

### Medium

**Missing Jailbreak / Root Detection**
- Pattern: No `jail-monkey`, `react-native-device-info.isRooted`, or `rn-rootbeer` dependency
- Risk: Rooted/jailbroken devices allow filesystem access, runtime hooking (Frida), and certificate pinning bypass
- Remediation: Integrate root/jailbreak detection; degrade functionality or warn users on compromised devices; combine with server-side attestation

---

## Flutter Specific

### High

**Insecure Platform Channel Communication**
- Pattern: `MethodChannel\(.*\)\.invokeMethod\(` with unvalidated method names or arguments
- Pattern: `EventChannel` broadcasting sensitive data without subscriber verification
- Risk: Malicious code injected via platform channels; method name spoofing
- Remediation: Validate all method names and arguments on the native side; use typed data classes; restrict channel access

**dart:ffi Misuse**
- Pattern: `DynamicLibrary\.open\(|ffi\.Pointer|ffi\.NativeFunction`
- Pattern: Raw pointer operations without bounds checking — `Pointer<.*>\.elementAt|\.asTypedList`
- Risk: Memory corruption, buffer overflows, use-after-free in native code called via FFI
- Remediation: Minimize FFI surface area; validate all inputs before passing to native code; use Dart isolates for untrusted data processing

### Medium

**Flutter Insecure SharedPreferences Usage**
- Pattern: `SharedPreferences\.getInstance\(\).*\.set(String|Bool|Int)\(.*(?i)(token|key|password|secret)`
- Risk: SharedPreferences is plaintext on both iOS and Android
- Remediation: Use `flutter_secure_storage` which maps to Keychain (iOS) and EncryptedSharedPreferences (Android)

---

## iOS Specific (Swift / SwiftUI)

### Critical

**Sensitive Data in UserDefaults Instead of Keychain**
- Pattern: `UserDefaults\.standard\.set\(.*(?i)(token|password|secret|key|session|credential)`
- Pattern: `@AppStorage\(.*(?i)(token|password|secret|auth)`
- Risk: UserDefaults is an unencrypted plist; readable via device backup, file browser on jailbroken device
- Remediation: Use `Keychain Services` (via `Security` framework or wrapper like `KeychainAccess`) for all credentials, tokens, and secrets

### High

**App Transport Security (ATS) Exceptions Too Broad**
- Pattern (Info.plist): `NSAllowsArbitraryLoads\s*</key>\s*<true`
- Pattern: `NSExceptionDomains` with `NSExceptionAllowsInsecureHTTPLoads.*true` for broad domains
- Risk: Disabling ATS allows cleartext HTTP and weakens TLS requirements across the app
- Remediation: Remove `NSAllowsArbitraryLoads`; add only specific domain exceptions with justification; Apple may reject apps with broad ATS exceptions

**Insecure NSURLSession Configuration**
- Pattern: `URLSession\(configuration:.*\.default\)` with custom delegate that returns `.useCredential` for all challenges
- Pattern: `didReceive challenge.*completionHandler\(\.useCredential` — blanket trust of server certificates
- Risk: Disables certificate validation; allows MITM with any certificate
- Remediation: Only trust specific certificates or use default system validation; implement proper `URLAuthenticationChallenge` handling

### Medium

**Background Snapshot Leaking Sensitive UI**
- Pattern: No `applicationWillResignActive` or `sceneWillResignActive` handler that obscures content
- Pattern: Missing `UIScreen.main.snapshotView` blur or overlay in `AppDelegate`
- Risk: iOS takes a screenshot when app enters background; visible in app switcher; extractable from device
- Remediation: Add a blur overlay or placeholder view in `applicationWillResignActive`; remove it in `applicationDidBecomeActive`

**Missing UIApplicationDelegate Protection**
- Pattern: `application.*open url.*options` handler without URL scheme/source validation
- Pattern: No `UIApplicationOpenURLOptionsSourceApplicationKey` check
- Risk: Other apps can invoke URL schemes without source verification
- Remediation: Validate source application in URL open handler; use Universal Links for sensitive flows

**Pasteboard Data Persistence**
- Pattern: `UIPasteboard\.general\.string =` with sensitive data
- Pattern: No `UIPasteboard.general.setItems(.*expiration` (missing expiration)
- Risk: Clipboard data persists across app switches; accessible to other apps before iOS 16
- Remediation: Set pasteboard item expiration; use local-only pasteboard (`UIPasteboard.withUniqueName()`) for sensitive data

### Low

**Missing Scene-Based Lifecycle Handling**
- Pattern: Using only `UIApplicationDelegate` without `UISceneDelegate` on iOS 13+
- Risk: Incomplete lifecycle management may miss security-relevant state transitions
- Remediation: Adopt `UISceneDelegate` for proper multi-window and background state management

---

## Android Specific (Kotlin / Jetpack Compose)

### Critical

**Debuggable Release Build**
- Pattern (AndroidManifest.xml): `android:debuggable\s*=\s*"true"`
- Risk: Allows attaching debugger to production app; full runtime inspection, memory dumps, and method hooking
- Remediation: Ensure `debuggable` is `false` in release `buildType`; use Gradle build variants to enforce this

**Exported Components Without Permissions**
- Pattern: `<activity[^>]*android:exported\s*=\s*"true"` without `android:permission`
- Pattern: `<service[^>]*android:exported\s*=\s*"true"` without `android:permission`
- Pattern: `<receiver[^>]*android:exported\s*=\s*"true"` without `android:permission`
- Risk: Any app on device can start exported activities, bind to services, or send broadcasts; leads to unauthorized actions and data theft
- Remediation: Set `android:exported="false"` unless external access is required; add `android:permission` with custom or signature-level permission

### High

**android:allowBackup Enabled**
- Pattern (AndroidManifest.xml): `android:allowBackup\s*=\s*"true"` or attribute not present (defaults to true)
- Risk: `adb backup` extracts app data including databases, shared preferences, and files from non-rooted device
- Remediation: Set `android:allowBackup="false"` or implement `BackupAgent` that excludes sensitive data; use `android:fullBackupContent` to specify exclusion rules

**Insecure ContentProvider Exposure**
- Pattern: `<provider[^>]*android:exported\s*=\s*"true"` without `android:readPermission|android:writePermission`
- Pattern: `content://` URIs accessible without grant permissions
- Risk: Other apps can query, insert, update, or delete data in exposed ContentProvider
- Remediation: Set `android:exported="false"` or add read/write permissions; use `grantUriPermission` for temporary access

**WebView with JavaScript Interface**
- Pattern: `\.addJavascriptInterface\(` combined with `\.setJavaScriptEnabled\(true\)`
- Pattern: `@JavascriptInterface` annotated methods that execute sensitive operations
- Risk: On Android < 4.2, all public methods are exposed; even on newer versions, exposed methods can be abused by injected scripts
- Remediation: Minimize methods annotated with `@JavascriptInterface`; validate all inputs; avoid exposing methods that access filesystem, contacts, or credentials

**Insecure Network Security Config**
- Pattern (network_security_config.xml): `cleartextTrafficPermitted\s*=\s*"true"`
- Pattern (AndroidManifest.xml): `android:usesCleartextTraffic\s*=\s*"true"`
- Risk: Allows HTTP plaintext traffic; credentials and data transmitted without encryption
- Remediation: Set `cleartextTrafficPermitted="false"` in network security config; add certificate pins in `<pin-set>`

### Medium

**Missing ProGuard / R8 Obfuscation**
- Pattern (build.gradle): `minifyEnabled\s+false` in release `buildTypes`
- Pattern: No `proguard-rules.pro` or `R8` configuration for release
- Risk: APK classes and method names are human-readable; simplifies reverse engineering
- Remediation: Enable `minifyEnabled true` and `shrinkResources true` in release build type; configure ProGuard rules for proper obfuscation

**StrictMode Violations in Production**
- Pattern: `StrictMode\.setThreadPolicy|StrictMode\.setVmPolicy` present in production code without build type guard
- Risk: StrictMode logging in production may reveal filesystem paths, network calls, and internal state in logcat
- Remediation: Guard StrictMode with `BuildConfig.DEBUG` check; ensure it is stripped from release builds

### Low

**Missing Android SafetyNet / Play Integrity Attestation**
- Pattern: No `SafetyNetClient|PlayIntegrity|IntegrityManager` usage
- Risk: Cannot verify device integrity; rooted devices, emulators, and modified ROMs go undetected
- Remediation: Integrate Play Integrity API; verify attestation server-side; degrade functionality on untrusted devices

---

## API Communication Security

### Critical

**Bearer Tokens in Insecure Storage**
- Pattern: `AsyncStorage\.setItem\(.*(?i)(bearer|access_token|jwt|refresh_token)`
- Pattern: `SharedPreferences.*(?i)(bearer|access_token|jwt)`
- Pattern: `UserDefaults.*(?i)(bearer|access_token|jwt)`
- Risk: Tokens in plaintext storage can be extracted and used to impersonate user
- Remediation: Store tokens in platform secure storage (Keychain, EncryptedSharedPreferences, react-native-keychain)

**Sensitive Data in URL Query Parameters**
- Pattern: `\?(.*&)?(token|api_key|password|secret|session_id|access_token)=`
- Pattern: `url.*\+.*(?i)(token|key|password|secret)`
- Risk: URLs are logged in server access logs, proxy logs, browser history, and crash reports
- Remediation: Send sensitive data in request headers or body; never in URL query strings

### High

**Token Refresh Without Rotation**
- Pattern: Refresh token endpoint returns new access token but same refresh token — `refresh_token.*=.*old|reuse`
- Pattern: No `refresh_token` field in token refresh response
- Risk: Stolen refresh token grants indefinite access; no way to detect token theft
- Remediation: Rotate refresh tokens on every use; invalidate the old refresh token; implement refresh token families for theft detection

**API Endpoints Without Certificate Pinning**
- Pattern: `fetch\(|axios\.|http\.get\(|http\.post\(|Dio\(\)` without pinning configuration
- Risk: MITM proxy can intercept API calls even over HTTPS on compromised networks
- Remediation: Pin server certificate or public key hash; implement backup pins for rotation

### Medium

**Missing Request Signing**
- Pattern: API requests lack HMAC signature or equivalent integrity check
- Pattern: No `X-Signature|X-HMAC|Authorization.*Signature` header construction
- Risk: Request tampering via proxy; replay attacks
- Remediation: Sign requests with HMAC using timestamp and nonce; verify signature server-side

**Missing Request Timeout**
- Pattern (React Native): `fetch\(` without `AbortController` or timeout wrapper
- Pattern (Flutter): `http\.Client\(\)` without `timeout` parameter on requests
- Pattern: `axios\.create\(\{` without `timeout` property
- Risk: Hung connections exhaust resources; poor UX; potential DoS vector
- Remediation: Set explicit timeouts on all network requests (e.g., 30s for API calls, 60s for uploads)

---

## Capacitor / Ionic Security

### Critical

**Missing Content Security Policy in index.html**
- Pattern: `<html` without `<meta.*Content-Security-Policy` in `index.html`
- Pattern: CSP with `unsafe-inline|unsafe-eval|\*` in `script-src`
- Risk: XSS in the WebView can access native Capacitor bridge and all installed plugins
- Remediation: Set strict CSP in `index.html`; restrict `script-src` and `connect-src`; avoid `unsafe-inline` and `unsafe-eval`

**Insecure Native Bridge Calls**
- Pattern: `Capacitor\.Plugins\.\w+\.\w+\(` with user-controlled arguments
- Pattern: `registerPlugin` exposing sensitive native functionality without input validation
- Risk: XSS or injected code gains access to native device APIs (camera, filesystem, contacts) through the bridge
- Remediation: Validate all arguments before passing to native plugins; restrict which plugins are registered; implement plugin-level authorization

### High

**Capacitor Plugin Permissions Too Broad**
- Pattern (AndroidManifest.xml): Multiple `<uses-permission android:name="android.permission\.(CAMERA|READ_CONTACTS|ACCESS_FINE_LOCATION|READ_EXTERNAL_STORAGE)"` when app functionality does not require them
- Pattern (Info.plist): `NSCameraUsageDescription|NSLocationWhenInUseUsageDescription` present but feature unused
- Risk: Over-privileged app increases attack surface; compromised WebView gains access to all granted permissions
- Remediation: Audit installed Capacitor plugins; remove unused plugins; request permissions at runtime only when needed

**Plugin Data Leakage**
- Pattern: `@capacitor/filesystem` writing sensitive data to external/public storage
- Pattern: `Filesystem\.writeFile\(.*directory:\s*Directory\.(Documents|External)`
- Pattern: `@capacitor/clipboard` used with sensitive data — `Clipboard\.write\(.*(?i)(token|password)`
- Risk: Data written to public directories is accessible to all apps; clipboard contents accessible to other apps
- Remediation: Use `Directory.Library` or `Directory.Data` for sensitive files; avoid clipboard for sensitive values; encrypt files at rest

### Medium

**Ionic HTTP Requests Without Pinning**
- Pattern: `@capacitor/core.*Http\.request` or `@ionic-native/http` without SSL pinning config
- Pattern: No `cordova-plugin-advanced-http` SSL pinning or equivalent
- Risk: MITM interception of API traffic in Capacitor/Ionic apps
- Remediation: Use `cordova-plugin-advanced-http` with `setSSLCertMode('pinned')` or implement pinning via Capacitor HTTP plugin

### Low

**Outdated Capacitor Core Version**
- Pattern (package.json): `"@capacitor/core"\s*:\s*"[<^~]?[0-3]\."` (versions before 4.x)
- Risk: Older Capacitor versions have known security issues in the bridge and plugin system
- Remediation: Upgrade to latest Capacitor major version; review migration guide for breaking security changes

---

## Detection Quick Reference

> **Note:** Patterns below use `|` for alternation. In the table, `OR` is used instead of `|` to avoid markdown conflicts. When using these in Grep, replace `OR` with `|`.

```
# Hardcoded keys (All platforms) — Critical
(api[_-]?key|secret|token)\s*[:=]\s*['"][A-Za-z0-9]{16,}

# AsyncStorage secrets (React Native) — Critical
AsyncStorage\.setItem.*(token|password|secret)

# UserDefaults secrets (iOS) — Critical
UserDefaults\.standard\.set.*(token|password)

# Debuggable release (Android) — Critical
android:debuggable\s*=\s*"true"

# ATS disabled (iOS) — High
NSAllowsArbitraryLoads.*true

# allowBackup (Android) — High
android:allowBackup\s*=\s*"true"

# No cert pinning (All) — High
(fetch\(|axios\.|http\.get)  # Check these exist without pinning wrapper

# JS interface (Android) — High
addJavascriptInterface\(

# WebView file access (React Native) — Critical
allowFileAccess\s*=\s*\{true\}

# Exported component (Android) — Critical
android:exported\s*=\s*"true"

# Cleartext traffic (Android) — High
cleartextTrafficPermitted\s*=\s*"true"

# Missing minify (Android) — Medium
minifyEnabled\s+false

# Clipboard secrets (All) — Medium
Clipboard\.(setString|setData|write).*(token|password)

# URL token leak (All) — Critical
\?.*(token|api_key|password)=
```
