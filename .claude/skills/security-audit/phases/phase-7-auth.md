# Phase 7 — Auth & Access Control

**Goal:** Audit authentication, authorization, and access control — adapting to the platform type.

**References:**
- Read `skills/security-audit/references/auth-and-access-checks.md` for traditional auth patterns
- If `is_baas = true`: read `skills/security-audit/references/baas-security-checks.md`
- If `is_ecommerce = true`: read `skills/security-audit/references/ecommerce-payments-checks.md`
- If `is_microservices = true`: read `skills/security-audit/references/microservices-checks.md`

## For ALL platform types:

1. **JWT security** (if JWT used): signature verification, algorithm restrictions, weak secrets, missing expiration, token storage (localStorage vs httpOnly cookie)

2. **OAuth** (if implemented): state parameter, PKCE, redirect URI validation, token handling

## For traditional-server / fullstack-hybrid:

3. **Session management**: regeneration on login, session store (not in-memory), timeout, cookie flags

4. **Password security**: proper hashing (bcrypt/argon2/scrypt), password policy, plaintext storage

5. **RBAC**: auth middleware on admin routes, client-side only authorization, IDOR, mass assignment

## For BaaS (Supabase, Firebase, Appwrite, PocketBase):

6. **Row Level Security / Security Rules** (most critical BaaS check):
   - **Supabase**: Every table has `ENABLE ROW LEVEL SECURITY`. Policies use `auth.uid()`. Flag `USING (true)` on non-public tables.
   - **Firebase Firestore**: `firestore.rules` — flag `allow read, write: if true`, rules without `request.auth != null`
   - **Firebase Realtime DB**: `database.rules.json` — flag `".read": true`
   - **Firebase Storage**: `storage.rules` — flag open access
   - **Appwrite**: Flag `Role.any()` on sensitive collections
   - **PocketBase**: Flag empty rule strings (= public access)

7. **BaaS-specific auth**: Edge function auth, Realtime subscription auth, storage policies, email confirmation, App Check / captcha

8. **Client-side authorization**: Flag role/admin/permission checks that exist ONLY in frontend code. Check for direct DB writes modifying sensitive fields from client.

## For fullstack-hybrid (Next.js, Nuxt, SvelteKit):

9. **API route auth**: Check every file in `pages/api/`, `app/api/`, `server/api/`, `src/routes/+server` for auth verification. Flag routes without `getServerSession`, `getUser`, `auth()`. Check middleware.ts/js.

## For ALL (continued):

10. **API authentication**: Rate limiting on auth endpoints, API key handling (header vs query string), CSRF protection on state-changing endpoints
