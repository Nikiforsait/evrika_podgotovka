```
╔══════════════════════════════════════════════════════════════════════╗
║  🛡️  SECURITY AUDIT REPORT                                         ║
║  Claude Code Security Audit Skill v1.0                              ║
╠══════════════════════════════════════════════════════════════════════╣
║  Project:    ShopWave — Next.js 14 E-Commerce Platform              ║
║  Date:       2026-03-20                                             ║
║  Scope:      Full audit (all 10 phases)                             ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Executive Summary

ShopWave is a Next.js 14 e-commerce platform using Supabase for authentication and database, Stripe for payment processing, and deployed on Vercel with GitHub Actions CI. The audit scanned **287 TypeScript files** across 10 security phases and identified **17 findings** including 2 critical vulnerabilities that require immediate remediation.

The most severe issues are a **SQL injection** in the product search API route and an **exposed Supabase `service_role` key** in a client-side environment variable. Both allow unauthenticated attackers to read or modify all database records. Four high-severity findings — missing Row Level Security on the orders table, an unverified Stripe webhook endpoint, a hardcoded JWT secret, and missing rate limiting on the login endpoint — compound the risk and should be addressed within 48 hours.

**Overall risk rating: CRITICAL.** The combination of injection, leaked credentials, and missing access controls on payment-related tables creates a realistic path to full data breach and financial fraud.

```
╔══════════════════════════════════════════════════════════════════════╗
║  📊 FINDINGS OVERVIEW                                               ║
╠══════════════════╦══════════╦════════════════════════════════════════╣
║  🔴 Critical     ║     2    ║  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ║
║  🟠 High         ║     4    ║  ████████████░░░░░░░░░░░░░░░░░░░░░░ ║
║  🟡 Medium       ║     6    ║  ██████████████████░░░░░░░░░░░░░░░░ ║
║  🔵 Low          ║     3    ║  █████████░░░░░░░░░░░░░░░░░░░░░░░░░ ║
║  ⚪ Info         ║     2    ║  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ║
╠══════════════════╬══════════╬════════════════════════════════════════╣
║  Total           ║    17    ║  Risk: 🔴 CRITICAL                    ║
╠══════════════════╬══════════╩════════════════════════════════════════╣
║  🔧 Auto-fixed   ║  6 findings                                     ║
║  🔒 Manual fix   ║  9 findings                                     ║
║  ⚪ Info only    ║  2 observations                                  ║
╚══════════════════╩══════════════════════════════════════════════════╝
```

### Stack Detected

```
╔══════════════════════════════════════════════════════════════════════╗
║  🔍 PLATFORM DETECTED                                               ║
╠══════════════════════════════════════════════════════════════════════╣
║  Primary:    fullstack-hybrid (Next.js 14)                           ║
║  Languages:  TypeScript (287 files)                                  ║
║  Overlays:   BaaS (Supabase), E-commerce (Stripe)                   ║
║  APIs:       API routes (app/api/), REST                             ║
║  Database:   PostgreSQL (via Supabase)                               ║
║  Infra:      Vercel, GitHub Actions, Docker                          ║
╠══════════════════════════════════════════════════════════════════════╣
║  Security check chains activated:                                    ║
║  ✅ Server-side SAST        ✅ Client-side XSS                      ║
║  ✅ API route auth           ✅ Supabase RLS policies                ║
║  ✅ Stripe webhook verify   ✅ Dependency audit                     ║
║  ✅ Secrets scan             ✅ IaC review                           ║
║  ✅ Env prefix audit         ✅ Logging & monitoring                 ║
║  ⬚ Mobile (N/A)            ⬚ Desktop (N/A)                        ║
║  ⬚ WordPress (N/A)         ⬚ Web3 (N/A)                           ║
║  ⬚ Browser ext (N/A)       ⬚ AI/ML (N/A)                          ║
╠══════════════════════════════════════════════════════════════════════╣
║  Reference files loaded: 6 core + 2 platform-specific               ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Top Findings Requiring Immediate Attention

```
┌──────────────────────────────────────────────────────────────────┐
│  🔴 #1 — SQL Injection in Product Search            CVSS: 9.8   │
│  File: src/app/api/products/search/route.ts:34   CWE: CWE-89   │
│  User input concatenated directly into SQL query string          │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│  🔴 #2 — Supabase service_role Key Exposed          CVSS: 9.1   │
│  File: .env.production:8                         CWE: CWE-798   │
│  NEXT_PUBLIC_SUPABASE_SERVICE_KEY leaks admin credentials        │
│  to the browser — bypasses all Row Level Security                │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│  🟠 #3 — Missing RLS on Orders Table                CVSS: 8.2   │
│  File: supabase/migrations/20260115_orders.sql   CWE: CWE-862   │
│  Orders table has no Row Level Security — any authenticated      │
│  user can read all orders including payment details               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase Results

```
  ✅ Phase 1  — Asset Discovery ·················· 0 findings
  ⚠️  Phase 2  — Configuration & Hardening ······· 3 findings
  ✅ Phase 3  — Dependency Audit ················· 1 finding
  ❌ Phase 4  — Code-Level SAST ·················· 3 findings
  ⚠️  Phase 5  — IaC Review ······················· 1 finding
  ❌ Phase 6  — Secrets & Credentials ··········· 2 findings
  ❌ Phase 7  — Auth & Access Control ············ 4 findings
  ⚠️  Phase 8  — Logging & Monitoring ············ 1 finding
  🛡️  Phase 9  — Report & Remediation ············ 6 auto-fixed
  📄 Phase 10 — PDF Report ······················ Generated
```

---

## Findings by Severity

### 🔴 Critical

```
┌──────────────────────────────────────────────────────────────────┐
│  🔴 CRITICAL — SQL Injection in Product Search      CVSS: 9.8   │
├──────────────────────────────────────────────────────────────────┤
│  File:    src/app/api/products/search/route.ts:34               │
│  CWE:     CWE-89                                                │
│  OWASP:   A03:2021 — Injection                                  │
│  Rule:    sqli-string-concat                                    │
├──────────────────────────────────────────────────────────────────┤
│  const { data } = await supabase                                │
│    .rpc('search_products', {                                    │
│      query: `SELECT * FROM products WHERE name ILIKE            │
│              '%${searchTerm}%'`                                  │
│    })           ^^^^^^^^^^^^^^                                  │
├──────────────────────────────────────────────────────────────────┤
│  💡 Remediation: Use Supabase's built-in .ilike() filter or     │
│     parameterized RPC arguments instead of string interpolation. │
│     Replace with: .from('products').select('*')                 │
│                   .ilike('name', `%${searchTerm}%`)             │
│  🔒 Status: Manual fix required (confirm before applying)       │
└──────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  🔴 CRITICAL — Supabase service_role Key in Client  CVSS: 9.1   │
├──────────────────────────────────────────────────────────────────┤
│  File:    .env.production:8                                     │
│  CWE:     CWE-798 (Use of Hard-coded Credentials)              │
│  OWASP:   A07:2021 — Identification and Authentication Failures │
│  Rule:    baas-service-key-exposure                             │
├──────────────────────────────────────────────────────────────────┤
│  NEXT_PUBLIC_SUPABASE_SERVICE_KEY=eyJh...RzQ4  ← EXPOSED       │
│                                                                 │
│  The NEXT_PUBLIC_ prefix causes this key to be bundled into     │
│  client-side JavaScript. The service_role key bypasses ALL      │
│  Row Level Security policies — anyone with browser DevTools     │
│  can extract it and gain full admin database access.            │
├──────────────────────────────────────────────────────────────────┤
│  💡 Remediation:                                                │
│     1. Remove the NEXT_PUBLIC_ prefix immediately               │
│     2. Rename to SUPABASE_SERVICE_ROLE_KEY (server-only)        │
│     3. Rotate the key in the Supabase dashboard                 │
│     4. Only use the service_role key in API routes / server     │
│        actions — never in client components                     │
│  🔒 Status: Manual fix required — key rotation needed           │
└──────────────────────────────────────────────────────────────────┘
```

### 🟠 High

```
┌──────────────────────────────────────────────────────────────────┐
│  🟠 HIGH — Missing RLS on Orders Table              CVSS: 8.2   │
├──────────────────────────────────────────────────────────────────┤
│  File:    supabase/migrations/20260115_orders.sql:1             │
│  CWE:     CWE-862 (Missing Authorization)                      │
│  OWASP:   A01:2021 — Broken Access Control                     │
├──────────────────────────────────────────────────────────────────┤
│  CREATE TABLE orders (                                          │
│    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,               │
│    user_id UUID REFERENCES auth.users(id),                      │
│    stripe_payment_intent TEXT,                                   │
│    total_cents INTEGER,                                         │
│    status TEXT DEFAULT 'pending'                                │
│  );                                                             │
│  -- ⚠️  No ALTER TABLE orders ENABLE ROW LEVEL SECURITY        │
│  -- ⚠️  No RLS policies defined                                │
├──────────────────────────────────────────────────────────────────┤
│  💡 Add RLS and a user-scoped policy:                           │
│     ALTER TABLE orders ENABLE ROW LEVEL SECURITY;               │
│     CREATE POLICY "Users see own orders" ON orders              │
│       FOR SELECT USING (auth.uid() = user_id);                  │
│  🔒 Status: Manual fix required (database migration)            │
└──────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  🟠 HIGH — Stripe Webhook Missing Signature Check   CVSS: 7.5   │
├──────────────────────────────────────────────────────────────────┤
│  File:    src/app/api/webhooks/stripe/route.ts:12               │
│  CWE:     CWE-345 (Insufficient Verification of Data Auth.)    │
│  OWASP:   A08:2021 — Software and Data Integrity Failures      │
├──────────────────────────────────────────────────────────────────┤
│  export async function POST(req: Request) {                     │
│    const body = await req.json()  // ← raw parse, no verify    │
│    const event = body as Stripe.Event                           │
│    // Missing: stripe.webhooks.constructEvent(body, sig, secret)│
│    if (event.type === 'checkout.session.completed') {           │
├──────────────────────────────────────────────────────────────────┤
│  💡 Use stripe.webhooks.constructEvent() with the raw body      │
│     and the Stripe-Signature header to verify authenticity.     │
│  🔒 Status: Manual fix required (confirm before applying)       │
└──────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  🟠 HIGH — Hardcoded JWT Secret                     CVSS: 7.4   │
├──────────────────────────────────────────────────────────────────┤
│  File:    src/lib/auth/jwt.ts:5                                 │
│  CWE:     CWE-798 (Use of Hard-coded Credentials)              │
│  OWASP:   A02:2021 — Cryptographic Failures                    │
├──────────────────────────────────────────────────────────────────┤
│  const JWT_SECRET = "shopwave-super-secret-key-2026"            │
│                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^          │
├──────────────────────────────────────────────────────────────────┤
│  💡 Move to environment variable: process.env.JWT_SECRET        │
│  🔒 Status: Manual fix required (secret rotation needed)        │
└──────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  🟠 HIGH — Missing Rate Limiting on Login           CVSS: 7.1   │
├──────────────────────────────────────────────────────────────────┤
│  File:    src/app/api/auth/login/route.ts:1                     │
│  CWE:     CWE-307 (Improper Restriction of Auth Attempts)      │
│  OWASP:   A07:2021 — Identification and Authentication Failures │
├──────────────────────────────────────────────────────────────────┤
│  export async function POST(req: Request) {                     │
│    const { email, password } = await req.json()                 │
│    // No rate limiting — allows unlimited brute-force attempts  │
│    const { data, error } = await supabase.auth.signIn(...)      │
├──────────────────────────────────────────────────────────────────┤
│  💡 Add rate limiting middleware (e.g., Vercel KV-based limiter │
│     or upstash/ratelimit) — max 5 attempts per IP per minute.   │
│  🔒 Status: Manual fix required                                 │
└──────────────────────────────────────────────────────────────────┘
```

### 🟡 Medium

```
┌──────────────────────────────────────────────────────────────────┐
│  🟡 MEDIUM — Missing Content Security Policy        CVSS: 5.8   │
├──────────────────────────────────────────────────────────────────┤
│  File:    next.config.ts:1                                      │
│  CWE:     CWE-693 (Protection Mechanism Failure)                │
│  OWASP:   A05:2021 — Security Misconfiguration                  │
├──────────────────────────────────────────────────────────────────┤
│  No Content-Security-Policy header configured in Next.js        │
│  headers() config or middleware. This allows unrestricted        │
│  script execution and increases XSS impact.                     │
├──────────────────────────────────────────────────────────────────┤
│  💡 Add CSP header in next.config.ts headers() function.        │
│  🔒 Status: Manual fix required (policy must be tailored)       │
└──────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  🟡 MEDIUM — Insecure Cookie Flags                  CVSS: 5.3   │
├──────────────────────────────────────────────────────────────────┤
│  File:    src/lib/auth/session.ts:18                            │
│  CWE:     CWE-614 (Sensitive Cookie Without Secure Flag)        │
│  OWASP:   A05:2021 — Security Misconfiguration                  │
├──────────────────────────────────────────────────────────────────┤
│  cookies().set('session_token', token, {                        │
│    httpOnly: false,     // ← should be true                     │
│    secure: false,       // ← should be true                     │
│  })                                                             │
├──────────────────────────────────────────────────────────────────┤
│  💡 Set httpOnly: true, secure: true, sameSite: 'lax'           │
│  🔧 Status: Auto-fixed                                         │
└──────────────────────────────────────────────────────────────────┘
```

```
┌─ 🔧 AUTO-FIX APPLIED ────────────────────────────────────────────┐
│  Finding: Insecure cookie flags on session token                  │
│  File:    src/lib/auth/session.ts:18                              │
│  Change:  cookies().set('session_token', token, {                 │
│             httpOnly: false, secure: false,                       │
│           })                                                      │
│       →   cookies().set('session_token', token, {                 │
│             httpOnly: true, secure: true, sameSite: 'lax',        │
│           })                                                      │
└───────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  🟡 MEDIUM — Unpinned Docker Base Image             CVSS: 5.1   │
├──────────────────────────────────────────────────────────────────┤
│  File:    Dockerfile:1                                          │
│  CWE:     CWE-829 (Inclusion of Untrusted Functionality)        │
│  OWASP:   A08:2021 — Software and Data Integrity Failures      │
├──────────────────────────────────────────────────────────────────┤
│  FROM node:latest                                               │
│             ^^^^^^ unpinned — build is non-reproducible          │
├──────────────────────────────────────────────────────────────────┤
│  💡 Pin to a specific version: FROM node:20.11.1-alpine         │
│  🔧 Status: Auto-fixed                                         │
└──────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  🟡 MEDIUM — Debug Mode Enabled in Production       CVSS: 4.7   │
├──────────────────────────────────────────────────────────────────┤
│  File:    src/lib/supabase/client.ts:9                          │
│  CWE:     CWE-489 (Active Debug Code)                           │
│  OWASP:   A05:2021 — Security Misconfiguration                  │
├──────────────────────────────────────────────────────────────────┤
│  export const supabase = createClient(url, key, {               │
│    db: { schema: 'public' },                                    │
│    global: { headers: {} },                                     │
│    auth: { debug: true },  // ← leaks auth flow to console     │
│  })                                                             │
├──────────────────────────────────────────────────────────────────┤
│  💡 Set debug: false or wrap in NODE_ENV check.                 │
│  🔧 Status: Auto-fixed                                         │
└──────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  🟡 MEDIUM — XSS via dangerouslySetInnerHTML        CVSS: 6.1   │
├──────────────────────────────────────────────────────────────────┤
│  File:    src/components/products/ProductDescription.tsx:23      │
│  CWE:     CWE-79 (Cross-site Scripting)                         │
│  OWASP:   A03:2021 — Injection                                  │
├──────────────────────────────────────────────────────────────────┤
│  <div dangerouslySetInnerHTML={{                                 │
│    __html: product.description   // ← unsanitized user content  │
│  }} />                                                          │
├──────────────────────────────────────────────────────────────────┤
│  💡 Sanitize with DOMPurify: __html: DOMPurify.sanitize(...)    │
│  🔒 Status: Manual fix required (confirm sanitization strategy) │
└──────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  🟡 MEDIUM — Missing CSRF Protection               CVSS: 4.3   │
├──────────────────────────────────────────────────────────────────┤
│  File:    src/app/api/account/update/route.ts:1                 │
│  CWE:     CWE-352 (Cross-Site Request Forgery)                  │
│  OWASP:   A01:2021 — Broken Access Control                     │
├──────────────────────────────────────────────────────────────────┤
│  State-changing POST endpoint without CSRF token validation.    │
│  Relies solely on cookie-based auth with no Origin/Referer      │
│  checking or anti-CSRF token.                                   │
├──────────────────────────────────────────────────────────────────┤
│  💡 Implement CSRF tokens or validate Origin header.            │
│  🔒 Status: Manual fix required                                 │
└──────────────────────────────────────────────────────────────────┘
```

### 🔵 Low

```
┌──────────────────────────────────────────────────────────────────┐
│  🔵 LOW — Missing Referrer-Policy Header            CVSS: 3.1   │
├──────────────────────────────────────────────────────────────────┤
│  File:    next.config.ts:1                                      │
│  CWE:     CWE-116 (Improper Encoding or Escaping of Output)     │
│  OWASP:   A05:2021 — Security Misconfiguration                  │
├──────────────────────────────────────────────────────────────────┤
│  No Referrer-Policy header set. Browser will default to          │
│  'strict-origin-when-cross-origin' but explicit is preferred.   │
├──────────────────────────────────────────────────────────────────┤
│  💡 Add Referrer-Policy: strict-origin-when-cross-origin        │
│  🔧 Status: Auto-fixed                                         │
└──────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  🔵 LOW — User Email Logged to Console              CVSS: 2.4   │
├──────────────────────────────────────────────────────────────────┤
│  File:    src/app/api/auth/login/route.ts:14                    │
│  CWE:     CWE-532 (Insertion of Sensitive Info into Log File)   │
│  OWASP:   A09:2021 — Security Logging and Monitoring Failures  │
├──────────────────────────────────────────────────────────────────┤
│  console.log(`Login attempt for: ${email}`)                     │
│                                    ^^^^^^^                      │
├──────────────────────────────────────────────────────────────────┤
│  💡 Remove PII from logs or use structured logging with         │
│     redaction. Log a user ID hash instead.                      │
│  🔧 Status: Auto-fixed (console.log removed)                   │
└──────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  🔵 LOW — Source Maps Enabled in Production         CVSS: 2.1   │
├──────────────────────────────────────────────────────────────────┤
│  File:    next.config.ts:3                                      │
│  CWE:     CWE-540 (Inclusion of Sensitive Info in Source Code)  │
│  OWASP:   A05:2021 — Security Misconfiguration                  │
├──────────────────────────────────────────────────────────────────┤
│  productionBrowserSourceMaps: true  // ← exposes source code    │
├──────────────────────────────────────────────────────────────────┤
│  💡 Set productionBrowserSourceMaps: false                      │
│  🔧 Status: Auto-fixed                                         │
└──────────────────────────────────────────────────────────────────┘
```

### ⚪ Informational

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚪ INFO — No Multi-Factor Authentication                       │
├──────────────────────────────────────────────────────────────────┤
│  Scope:   Project-wide                                          │
│  CWE:     CWE-308 (Use of Single-factor Authentication)        │
├──────────────────────────────────────────────────────────────────┤
│  No MFA/2FA implementation detected. Supabase supports TOTP-    │
│  based MFA natively. Recommended for admin accounts and         │
│  high-value customer accounts handling payment methods.          │
├──────────────────────────────────────────────────────────────────┤
│  💡 Enable Supabase MFA: supabase.auth.mfa.enroll()             │
│  ⚪ Status: Observation — no immediate risk                     │
└──────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────┐
│  ⚪ INFO — No Monitoring / Error Tracking Integration           │
├──────────────────────────────────────────────────────────────────┤
│  Scope:   Project-wide                                          │
│  CWE:     CWE-778 (Insufficient Logging)                       │
├──────────────────────────────────────────────────────────────────┤
│  No integration detected with Sentry, Datadog, New Relic, or    │
│  equivalent monitoring service. Security events (failed logins, │
│  payment errors, permission denials) are not tracked or alerted. │
├──────────────────────────────────────────────────────────────────┤
│  💡 Add Sentry (@sentry/nextjs) or Vercel Analytics at minimum. │
│  ⚪ Status: Observation — recommended improvement               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Compliance Mapping

| Finding | CWE | OWASP Top 10 | SOC 2 | PCI-DSS | HIPAA |
|---|---|---|---|---|---|
| SQL Injection in Search | CWE-89 | A03:2021 Injection | CC6.1 | Req 6.5.1 | §164.312(a)(1) |
| service_role Key Exposed | CWE-798 | A07:2021 Auth Failures | CC6.1 | Req 6.5.10 | §164.312(d) |
| Missing RLS on Orders | CWE-862 | A01:2021 Broken Access | CC6.3 | Req 7.1 | §164.312(a)(1) |
| Stripe Webhook Unverified | CWE-345 | A08:2021 Integrity | CC6.1 | Req 6.5.3 | — |
| Hardcoded JWT Secret | CWE-798 | A02:2021 Crypto Failures | CC6.1 | Req 6.5.10 | §164.312(d) |
| Missing Rate Limiting | CWE-307 | A07:2021 Auth Failures | CC6.1 | Req 6.5.10 | §164.312(d) |
| Missing CSP Header | CWE-693 | A05:2021 Misconfig | CC6.6 | Req 6.6 | — |
| Insecure Cookie Flags | CWE-614 | A05:2021 Misconfig | CC6.1 | Req 6.5.10 | §164.312(d) |
| Unpinned Docker Image | CWE-829 | A08:2021 Integrity | CC7.1 | Req 6.3.2 | — |
| Debug Mode in Production | CWE-489 | A05:2021 Misconfig | CC6.1 | Req 6.5.5 | — |
| XSS via innerHTML | CWE-79 | A03:2021 Injection | CC6.1 | Req 6.5.7 | — |
| Missing CSRF Protection | CWE-352 | A01:2021 Broken Access | CC6.1 | Req 6.5.9 | — |
| Missing Referrer-Policy | CWE-116 | A05:2021 Misconfig | CC6.6 | Req 6.6 | — |
| Email in Console Log | CWE-532 | A09:2021 Logging | CC6.1 | Req 10.5.2 | §164.312(b) |
| Source Maps in Prod | CWE-540 | A05:2021 Misconfig | CC6.1 | Req 6.5.5 | — |
| No MFA Implementation | CWE-308 | A07:2021 Auth Failures | CC6.1 | Req 8.3 | §164.312(d) |
| No Monitoring Integration | CWE-778 | A09:2021 Logging | CC7.2 | Req 10.6 | §164.312(b) |

---

## Remediation Summary

### 🔧 Auto-Remediated (applied automatically)

```
┌─ 🔧 AUTO-FIX #1 ─────────────────────────────────────────────────┐
│  Finding:  Insecure cookie flags                                  │
│  File:     src/lib/auth/session.ts:18                             │
│  Change:   { httpOnly: false, secure: false }                     │
│        →   { httpOnly: true, secure: true, sameSite: 'lax' }     │
└───────────────────────────────────────────────────────────────────┘
┌─ 🔧 AUTO-FIX #2 ─────────────────────────────────────────────────┐
│  Finding:  Unpinned Docker base image                             │
│  File:     Dockerfile:1                                           │
│  Change:   FROM node:latest                                       │
│        →   FROM node:20.11.1-alpine                               │
└───────────────────────────────────────────────────────────────────┘
┌─ 🔧 AUTO-FIX #3 ─────────────────────────────────────────────────┐
│  Finding:  Debug mode enabled in production                       │
│  File:     src/lib/supabase/client.ts:9                           │
│  Change:   auth: { debug: true }                                  │
│        →   auth: { debug: process.env.NODE_ENV === 'development' }│
└───────────────────────────────────────────────────────────────────┘
┌─ 🔧 AUTO-FIX #4 ─────────────────────────────────────────────────┐
│  Finding:  Missing Referrer-Policy header                         │
│  File:     next.config.ts (headers function)                      │
│  Change:   Added { key: 'Referrer-Policy',                        │
│                     value: 'strict-origin-when-cross-origin' }    │
└───────────────────────────────────────────────────────────────────┘
┌─ 🔧 AUTO-FIX #5 ─────────────────────────────────────────────────┐
│  Finding:  User email logged to console                           │
│  File:     src/app/api/auth/login/route.ts:14                     │
│  Change:   console.log(`Login attempt for: ${email}`)             │
│        →   (line removed)                                         │
└───────────────────────────────────────────────────────────────────┘
┌─ 🔧 AUTO-FIX #6 ─────────────────────────────────────────────────┐
│  Finding:  Source maps in production                               │
│  File:     next.config.ts:3                                       │
│  Change:   productionBrowserSourceMaps: true                      │
│        →   productionBrowserSourceMaps: false                     │
└───────────────────────────────────────────────────────────────────┘
```

### 🔒 Manual Remediation Required

| # | Severity | Finding | Owner Action |
|---|---|---|---|
| 1 | 🔴 Critical | SQL Injection in Product Search | Rewrite query using Supabase `.ilike()` filter |
| 2 | 🔴 Critical | service_role Key Exposed | Remove `NEXT_PUBLIC_` prefix, rotate key in Supabase dashboard |
| 3 | 🟠 High | Missing RLS on Orders Table | Add migration with `ENABLE ROW LEVEL SECURITY` and user-scoped policies |
| 4 | 🟠 High | Stripe Webhook Unverified | Add `stripe.webhooks.constructEvent()` signature check |
| 5 | 🟠 High | Hardcoded JWT Secret | Move to `process.env.JWT_SECRET`, rotate value |
| 6 | 🟠 High | Missing Rate Limiting on Login | Add `@upstash/ratelimit` or Vercel KV rate limiter |
| 7 | 🟡 Medium | Missing CSP Header | Define Content-Security-Policy in `next.config.ts` headers |
| 8 | 🟡 Medium | XSS via dangerouslySetInnerHTML | Add DOMPurify sanitization before rendering |
| 9 | 🟡 Medium | Missing CSRF Protection | Add CSRF token validation or Origin header check |

### 📋 Recommended Follow-Up Actions

1. **Immediate (within 24 hours):** Fix both critical findings. The exposed `service_role` key grants full database access — rotate the key in the Supabase dashboard even after removing the `NEXT_PUBLIC_` prefix, as the old key may be cached in CDN or browser storage.

2. **Short-term (within 1 week):** Address all high-severity findings. The missing RLS on the orders table combined with the Stripe webhook issue creates a path for order manipulation. Add rate limiting before a credential stuffing campaign targets the login endpoint.

3. **Medium-term (within 1 month):** Implement CSP headers, CSRF protection, and XSS sanitization. Enable MFA for admin accounts. Integrate Sentry or a monitoring solution to detect and alert on security events.

4. **Ongoing:** Run `/security-audit recheck` after each remediation cycle. Add `npm audit` to the GitHub Actions pipeline. Consider a quarterly full audit schedule.

---

## Dependency Audit

```
┌──────────────────────────────────────────────────────────────────┐
│  📦 DEPENDENCY AUDIT RESULTS                                     │
├──────────────────────────────────────────────────────────────────┤
│  Package manager:  npm (package-lock.json present)               │
│  Total packages:   1,247 (direct: 43, transitive: 1,204)        │
│  Lockfile:         ✅ Present and committed                      │
│  Registry:         ✅ All packages from https://registry.npmjs   │
├──────────────────────────────────────────────────────────────────┤
│  Vulnerabilities found by npm audit:                             │
│                                                                  │
│  🟡 MEDIUM  next < 14.1.1 — Server-Side Request Forgery         │
│             CVE-2024-34350 · Fix: upgrade to next@14.2.0+        │
│                                                                  │
│  No critical or high CVEs found in direct dependencies.          │
│  3 low-severity advisories in transitive dependencies (dev only).│
├──────────────────────────────────────────────────────────────────┤
│  ⚠️  next@14.0.4 is 2 minor versions behind latest (14.2.3).    │
│  💡 Run: npm install next@latest                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## Secrets Scan

```
┌──────────────────────────────────────────────────────────────────┐
│  🔑 SECRETS SCAN RESULTS                                         │
├──────────────────────────────────────────────────────────────────┤
│  Files scanned:   287 source + 12 config files                   │
│  .gitignore:      ✅ Covers .env, .env.local, .env.production    │
│  .env.example:    ✅ Present (no real values)                     │
├──────────────────────────────────────────────────────────────────┤
│  🔴 FINDING: NEXT_PUBLIC_SUPABASE_SERVICE_KEY in .env.production │
│     Value:  eyJh····RzQ4 (masked)                                │
│     Risk:   Bundled into client JS via NEXT_PUBLIC_ prefix       │
│                                                                  │
│  🟠 FINDING: Hardcoded JWT secret in src/lib/auth/jwt.ts:5      │
│     Value:  shop····2026 (masked)                                │
│     Risk:   Allows token forgery if source code is leaked        │
│                                                                  │
│  ✅ Stripe keys correctly use STRIPE_SECRET_KEY (no NEXT_PUBLIC_)│
│  ✅ Supabase anon key correctly in NEXT_PUBLIC_ (expected)       │
│  ✅ No AWS/GCP/Azure credentials detected                        │
│  ✅ No private keys (.pem, .key) found in repository             │
│  ✅ Git history scan: no previously committed secrets found       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Infrastructure as Code Review

```
┌──────────────────────────────────────────────────────────────────┐
│  🏗️  IAC REVIEW RESULTS                                          │
├──────────────────────────────────────────────────────────────────┤
│  Docker:          Dockerfile, .dockerignore                      │
│  CI/CD:           .github/workflows/deploy.yml                   │
│  Hosting:         Vercel (vercel.json)                           │
│  Terraform/K8s:   Not detected                                   │
├──────────────────────────────────────────────────────────────────┤
│  Dockerfile:                                                     │
│  🟡 Unpinned base image (auto-fixed → node:20.11.1-alpine)      │
│  ✅ Non-root USER directive present                              │
│  ✅ Multi-stage build used                                       │
│  ✅ .dockerignore excludes node_modules, .env, .git              │
│                                                                  │
│  GitHub Actions (.github/workflows/deploy.yml):                  │
│  ✅ Actions pinned to SHA (actions/checkout@v4 → sha)            │
│  ✅ Secrets passed via ${{ secrets.* }} not hardcoded            │
│  ✅ Permissions scoped (contents: read)                          │
│  ✅ No privileged workflow triggers                              │
│                                                                  │
│  Vercel (vercel.json):                                           │
│  ✅ No sensitive env vars in vercel.json                         │
│  ✅ Build command does not expose secrets                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Re-Audit Instructions

To verify that remediation has been applied:

```
/security-audit recheck
```

To re-run the full audit:

```
/security-audit full
```

To audit a specific phase:

```
/security-audit <phase>
```

Available phases: `discovery`, `config`, `deps`, `sast`, `iac`, `secrets`, `auth`, `logging`

Run a compliance-focused audit:

```
/security-audit --pci
/security-audit --hipaa
/security-audit --soc2
```

---

```
╔══════════════════════════════════════════════════════════════════════╗
║  Generated by Claude Code Security Audit Skill v1.0                 ║
║  Audit completed: 2026-03-20 · Duration: 2m 34s · 287 files        ║
║  This report should be reviewed by a qualified security             ║
║  professional before being used for compliance purposes.            ║
╚══════════════════════════════════════════════════════════════════════╝
```
