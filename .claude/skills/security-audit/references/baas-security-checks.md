# Backend-as-a-Service (BaaS) Security Checks

Reference file for projects using Supabase, Firebase, Appwrite, PocketBase, or other BaaS platforms — where there is no traditional backend server and the client talks directly to the platform.

These projects have a fundamentally different attack surface: the "backend" is configuration, not code. Security depends on policies (RLS, security rules), client-side key scoping, and proper use of the platform's auth and storage features.

---

## Detection

A BaaS project is identified in Phase 1 when:

**Supabase:**
- `@supabase/supabase-js` in package.json
- `createClient` from `@supabase/supabase-js`
- `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` in env or code
- `supabase/` directory with `migrations/` or `config.toml`
- `.supabase/` directory

**Firebase:**
- `firebase` or `firebase-admin` in package.json
- `initializeApp` from `firebase/app`
- `FIREBASE_CONFIG` / `NEXT_PUBLIC_FIREBASE_` env vars
- `firebase.json` / `.firebaserc` / `firestore.rules` / `storage.rules`

**Appwrite:**
- `appwrite` in package.json
- `Client()` from `appwrite`
- `APPWRITE_ENDPOINT` / `APPWRITE_PROJECT` env vars

**PocketBase:**
- `pocketbase` in package.json
- `PocketBase` constructor import

**General BaaS signals:**
- No `express`, `fastify`, `django`, `flask`, `rails`, `spring` in dependencies
- Client-side only project (React, Vue, Angular, Svelte, Next.js with no API routes)
- Direct database client calls from frontend code

When BaaS is detected, set `STACK_PROFILE.is_baas = true` and `STACK_PROFILE.baas_provider = <name>`.

---

## Supabase Security Checks

### Critical

**Service Role Key Exposed to Client**
- Pattern: `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE|VITE_SUPABASE_SERVICE_ROLE|REACT_APP_SUPABASE_SERVICE_ROLE`
- Pattern: `supabase_service_role_key` in any client-accessible file
- Pattern: `createClient\(.*service_role` in frontend code
- Risk: Service role key bypasses ALL Row Level Security — full database read/write
- Remediation: **NEVER** expose the service role key to the client. Use it only in server-side code (API routes, edge functions, server components). Only the `anon` key should be in client code.
- Severity: **Critical (10.0)** — equivalent to giving every visitor full database admin access

**Missing Row Level Security (RLS)**
- Pattern: Supabase migration files with `CREATE TABLE` but no corresponding `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- Pattern: `supabase/migrations/*.sql` without `ENABLE ROW LEVEL SECURITY` for each table
- Pattern: Tables accessible via `supabase.from('table').select('*')` without RLS
- Check: Run `grep -L "ENABLE ROW LEVEL SECURITY" supabase/migrations/*.sql` to find migrations creating tables without RLS
- Risk: Without RLS, any authenticated user (or anon user) can read/write ALL rows in the table
- Remediation: Enable RLS on EVERY table: `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;`
- Severity: **Critical (9.8)**

**Overly Permissive RLS Policies**
- Pattern: `CREATE POLICY.*USING\s*\(\s*true\s*\)` — policy that allows everyone
- Pattern: `CREATE POLICY.*FOR ALL.*USING\s*\(\s*true\s*\)`
- Pattern: `TO public` or `TO anon` with permissive USING clause
- Pattern: RLS policy without `auth.uid()` check on user-owned data
- Risk: RLS exists but doesn't actually restrict access
- Remediation: Policies should check ownership: `USING (auth.uid() = user_id)`
- Severity: **Critical (9.5)**

### High

**Anon Key with Excessive Permissions**
- Pattern: RLS policies that grant broad access to `anon` role
- Pattern: `CREATE POLICY.*TO anon.*USING\s*\(\s*true\s*\)` — anon can read everything
- Pattern: Insert/update/delete policies for `anon` role on sensitive tables
- Risk: Unauthenticated users can access data
- Remediation: Restrict anon access to only what unauthenticated users genuinely need (e.g., public listings)

**Supabase Storage Bucket Misconfiguration**
- Pattern: `createClient.*storage.*from\('public` — public bucket usage for private data
- Pattern: Storage policies without `auth.uid()` checks
- Pattern: No storage policies defined (default: deny, but often misconfigured to allow)
- Risk: Files accessible without authentication
- Remediation: Use private buckets with RLS policies; validate file types and sizes

**Direct Database Queries from Client Without Filtering**
- Pattern: `supabase\.from\(.*\.select\('?\*'?\)` without `.eq()` or `.match()` filter on user ID
- Pattern: `supabase\.rpc\(` calling functions that don't check `auth.uid()`
- Risk: Data leakage — client can fetch all rows
- Remediation: Always filter by authenticated user; rely on RLS as defense-in-depth

**Missing Auth on Realtime Subscriptions**
- Pattern: `supabase\.channel\(` or `.on('postgres_changes'` without auth checks
- Pattern: Realtime enabled on tables containing private data without RLS
- Risk: Unauthenticated users can subscribe to data changes
- Remediation: RLS policies apply to realtime — ensure they're set. Additionally, use Supabase Realtime auth.

**Edge Functions Without Auth Verification**
- Pattern: `supabase/functions/*/index.ts` without `req.headers.get('Authorization')`
- Pattern: Edge functions that don't call `supabase.auth.getUser()`
- Risk: Unauthenticated access to server-side logic
- Remediation: Verify JWT in every edge function: `const { data: { user } } = await supabase.auth.getUser(token)`

### Medium

**Client-Side Data Validation Only**
- Pattern: Zod/Yup schemas in frontend but no database constraints or RLS checks
- Pattern: Form validation without corresponding `CHECK` constraints in migrations
- Risk: Client-side validation is easily bypassed — users can call Supabase API directly
- Remediation: Add database-level constraints (`CHECK`, `NOT NULL`, foreign keys) and RLS policies

**Hardcoded Supabase URL/Key in Source**
- Pattern: `createClient\(['"]https://.*\.supabase\.co['"],\s*['"]eyJ` — URL and anon key in code
- Note: The anon key is designed to be public, so this is Medium, not Critical
- Remediation: Move to environment variables for configurability (not security — the anon key is public by design)

**Missing Email Confirmation**
- Pattern: Supabase auth config without email confirmation requirement
- Pattern: `supabase.auth.signUp` without checking `.user.confirmed_at`
- Risk: Fake account creation, email enumeration
- Remediation: Enable email confirmation in Supabase dashboard; check confirmation status

**Supabase Admin Client in Client Code**
- Pattern: `createClient.*{.*auth:.*autoRefreshToken.*persistSession` with service role key
- Pattern: Using `supabase-admin` or admin client outside of server context
- Remediation: Admin/service-role clients should ONLY exist in server code

### Low

**Missing Database Indexes on RLS Policy Columns**
- Pattern: RLS policy using `auth.uid() = user_id` but `user_id` column has no index
- Risk: Performance degradation on large tables (not a security vulnerability per se)
- Remediation: Add index on columns used in RLS policies

---

## Firebase Security Checks

### Critical

**Firestore Security Rules — Open Read/Write**
- Pattern (firestore.rules): `allow read, write: if true|allow read, write;` (no condition)
- Pattern: `match /{document=**} { allow read, write: if true; }`
- Pattern: Missing `firestore.rules` file entirely (defaults may be permissive in dev)
- Risk: Anyone can read/write any document in the database
- Remediation: Write granular rules per collection; require authentication
- Severity: **Critical (10.0)**

**Storage Rules — Open Access**
- Pattern (storage.rules): `allow read, write: if true`
- Pattern: `match /{allPaths=**} { allow read, write; }`
- Risk: Anyone can upload/download/delete any file
- Remediation: Require auth; validate file types and sizes in rules
- Severity: **Critical (9.8)**

**Admin SDK Key Exposed to Client**
- Pattern: `firebase-admin` imported in client-side code
- Pattern: Service account JSON (`"type": "service_account"`) in client-accessible files
- Pattern: `FIREBASE_ADMIN_SDK` / `GOOGLE_APPLICATION_CREDENTIALS` in client env vars
- Risk: Full database admin access from client
- Severity: **Critical (10.0)**

### High

**Firestore Rules Without Auth Check**
- Pattern: `allow read: if true` or `allow write: if true` on user-data collections
- Pattern: Rules without `request.auth != null` on non-public collections
- Remediation: `allow read: if request.auth != null && request.auth.uid == resource.data.userId`

**Realtime Database Rules — Permissive**
- Pattern (database.rules.json): `".read": true` or `".write": true`
- Remediation: Use `"$uid": { ".read": "$uid === auth.uid" }` pattern

**Missing Data Validation in Rules**
- Pattern: Write rules without `request.resource.data` validation
- Pattern: No field type/size validation in Firestore rules
- Risk: Clients can write arbitrary data structures
- Remediation: Validate data types, required fields, and sizes in security rules

**Firebase API Key Restrictions Missing**
- Pattern: Firebase config with API key but no HTTP referrer or IP restrictions configured
- Note: Firebase API keys are designed to be public, but should still be restricted to your domains
- Remediation: Set API key restrictions in Google Cloud Console (HTTP referrers, API restrictions)

### Medium

**Client-Side Firestore Queries Without Limits**
- Pattern: `collection(db, 'name').get()` or `getDocs(query)` without `limit()`
- Risk: Cost explosion; data exfiltration
- Remediation: Always use `limit()` and pagination in client queries

**Cloud Functions Without Auth**
- Pattern: `functions.https.onRequest` without checking `context.auth`
- Pattern: `onCall` functions without `if (!context.auth)` check
- Remediation: Verify authentication in every Cloud Function

**Firebase Emulator in Production**
- Pattern: `connectFirestoreEmulator|connectAuthEmulator|useEmulator` without env guard
- Risk: Production traffic routed to emulator
- Remediation: Guard behind `if (process.env.NODE_ENV === 'development')`

---

## Appwrite Security Checks

### Critical

**Wildcard Collection Permissions**
- Pattern: `Permission.read(Role.any())` or `Permission.write(Role.any())` on sensitive collections
- Risk: Any user (including guests) can read/write
- Remediation: Use `Role.user(userId)` for user-owned data

### High

**Missing Document Security**
- Pattern: Collections without document-level permissions
- Pattern: Using `Permission.read(Role.users())` (any logged-in user) on private data
- Remediation: Set document-level permissions using `Role.user(userId)`

**API Key Scope**
- Pattern: Using project API key with full scope instead of scoped API keys
- Remediation: Create scoped keys per client platform

---

## PocketBase Security Checks

### Critical

**Open API Rules**
- Pattern: Collection rules with empty `listRule`, `viewRule`, `createRule` (empty string = public access)
- Risk: All data publicly accessible
- Remediation: Set rules requiring `@request.auth.id != ""`

### High

**Admin API Exposed**
- Pattern: PocketBase admin UI accessible without IP restriction
- Remediation: Restrict admin routes to internal network

---

## Cross-Platform BaaS Checks

### Critical

**Business Logic in Client Code Only**
- Pattern: Authorization checks, price calculations, role assignments done only in frontend
- Pattern: `.update({ role: 'admin' })` or `.update({ price: ... })` from client without server validation
- Risk: Any user can modify client code or call the API directly to bypass logic
- Remediation: Use database triggers, RLS policies, edge functions, or Cloud Functions for business logic that must be enforced

**Direct Table/Collection Access for Admin Operations**
- Pattern: Client code performing admin operations (user management, role changes, data deletion) via direct database calls
- Risk: Client-side admin logic can be bypassed
- Remediation: Move admin operations to server-side functions with proper auth

### High

**Missing Rate Limiting on BaaS Calls**
- Pattern: No rate limiting on client-side API calls to Supabase/Firebase
- Pattern: Supabase: no `pg_net` or edge function rate limiting
- Pattern: Firebase: no App Check enabled
- Risk: Abuse, cost explosion, DoS
- Remediation: Enable platform-specific rate limiting; use Firebase App Check; add rate limiting in edge functions

**OAuth/Social Auth Misconfiguration**
- Pattern: OAuth providers configured without proper redirect URL validation
- Pattern (Supabase): `supabase.auth.signInWithOAuth({ provider: '...' })` without specifying `redirectTo` properly
- Pattern (Firebase): OAuth provider without authorized domains configured
- Risk: OAuth token theft via redirect manipulation
- Remediation: Restrict authorized redirect URLs and domains

**Exposed Environment Variables**
- Pattern (Next.js): `NEXT_PUBLIC_` prefix on sensitive values (service role keys, admin tokens)
- Pattern (Vite): `VITE_` prefix on sensitive values
- Pattern (CRA): `REACT_APP_` prefix on sensitive values
- Note: Only the anon/public key should have a public prefix. Service role keys, admin keys, and secrets must NEVER have a public prefix.
- Remediation: Audit all `NEXT_PUBLIC_*` / `VITE_*` / `REACT_APP_*` vars — only public keys should be there

### Medium

**Missing Webhook Signature Verification**
- Pattern: Webhook endpoints without signature verification
- Pattern (Supabase): Webhook handler without checking `x-supabase-signature`
- Pattern (Stripe+Supabase): `stripe.webhooks.constructEvent` not used
- Risk: Webhook spoofing — attacker triggers fake events
- Remediation: Always verify webhook signatures

**Overly Broad Data Fetching**
- Pattern: `select('*')` on tables with sensitive columns
- Pattern: Fetching full user profiles when only name is needed
- Risk: Exposing unnecessary data (emails, phone numbers, metadata)
- Remediation: Select only needed columns: `select('id, name, avatar_url')`

**Missing Supabase/Firebase Auth Listeners**
- Pattern: No `onAuthStateChange` (Supabase) or `onAuthStateChanged` (Firebase) listener
- Pattern: Not handling token refresh or session expiry
- Risk: Stale sessions, broken auth state
- Remediation: Set up auth state listener at app root; handle session expiry gracefully

### Low

**Missing App Check / Captcha**
- Pattern (Firebase): No `firebase/app-check` import; no App Check initialization
- Pattern (Supabase): No captcha on auth endpoints
- Risk: Bot abuse, automated account creation
- Remediation: Enable Firebase App Check or Supabase captcha (hCaptcha/Turnstile)

**Database Migrations Not Version Controlled**
- Pattern (Supabase): No `supabase/migrations/` directory in git
- Pattern: Database schema changes made via dashboard without migration files
- Risk: Unauditable schema changes; can't reproduce RLS policies from code
- Remediation: Use `supabase db diff` to generate migration files; commit them

---

## Serverless / Edge Runtime Checks

For projects using Vercel/Netlify/Cloudflare serverless functions alongside BaaS:

### High

**Secrets in Edge Function Source**
- Pattern: API keys hardcoded in `api/`, `functions/`, `pages/api/`, `app/api/` directories
- Pattern: Service role key in serverless function code instead of environment variable
- Remediation: Use platform secret/env var management (Vercel env vars, Netlify env, etc.)

**No Auth in API Routes**
- Pattern (Next.js): `pages/api/*.ts` or `app/api/*/route.ts` without auth check
- Pattern (Nuxt): `server/api/*.ts` without auth verification
- Pattern: Missing `getServerSession` / `getUser` / `auth()` in API routes
- Risk: Unauthenticated access to server-side operations
- Remediation: Verify auth in every API route; use middleware for common auth logic

**CORS on API Routes**
- Pattern: API routes without explicit CORS headers or with `Access-Control-Allow-Origin: *`
- Pattern (Next.js): `next.config.js` headers with wildcard CORS
- Remediation: Restrict CORS to your domains

### Medium

**Cold Start Sensitive Operations**
- Pattern: Secret fetching (from vault, KMS) on every cold start without caching
- Risk: Performance degradation; increased secret manager costs
- Remediation: Cache secrets in module scope (warm between invocations)

**Missing Request Validation in API Routes**
- Pattern: `req.body` used directly without validation in API routes
- Remediation: Validate with Zod or similar before processing

---

## Remediation Guidance — BaaS Specific

### Auto-fixable (Low/Medium)

1. **Move hardcoded Supabase/Firebase config to env vars** — replace inline URLs and keys with `process.env.*` references
2. **Add `.env.local` to `.gitignore`** — prevent accidental commit of env files
3. **Add `select()` column filtering** — replace `select('*')` with specific columns
4. **Add auth state listener** — inject `onAuthStateChange` / `onAuthStateChanged` at app root

### Requires Confirmation (High/Critical)

1. **Add RLS policies** — generate `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and policy stubs
2. **Move service role key to server-side** — refactor client code to call API route instead of direct DB
3. **Add security rules** (Firebase) — generate starter rules with auth checks
4. **Add auth verification to edge/API functions** — inject auth check boilerplate

### Manual Only

1. **Firebase/Supabase dashboard configuration** — API key restrictions, auth provider settings, storage bucket policies
2. **Database schema changes** — adding constraints, indexes for RLS columns
3. **OAuth provider configuration** — redirect URLs, authorized domains
4. **Platform-specific rate limiting** — requires dashboard/infrastructure configuration
