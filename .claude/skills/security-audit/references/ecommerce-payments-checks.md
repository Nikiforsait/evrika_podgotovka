# E-commerce & Payment Integration Security Checks

Reference file for e-commerce applications and payment provider integrations. Covers payment gateway security, business logic flaws, PCI-DSS compliance, and platform-specific checks (Shopify, Stripe, PayPal, Square, Braintree).

---

## Payment Provider Security

### Critical

**Stripe: Missing Webhook Signature Verification**
- Pattern: `app\.(post|all)\(.*(webhook|stripe)` without `stripe\.webhooks\.constructEvent`
- Pattern: `req\.body` used directly in webhook handler without `constructEvent(req.body, sig, secret)`
- Pattern: Webhook route using `express\.json\(\)` instead of `express\.raw\(\)` for body parsing
- Risk: Attacker can forge webhook events, trigger fake payment confirmations, grant unauthorized access
- Remediation: Always verify signatures with `stripe.webhooks.constructEvent(payload, sig, endpointSecret)` and use raw body parsing on the webhook route
- Severity: **Critical (9.8)**

**Stripe: Live Secret Key Exposed to Client**
- Pattern: `sk_live_[a-zA-Z0-9]{24,}` in client-accessible files (`.js`, `.ts`, `.jsx`, `.tsx`, `.vue`, `.svelte`)
- Pattern: `NEXT_PUBLIC_STRIPE_SECRET|VITE_STRIPE_SECRET|REACT_APP_STRIPE_SECRET`
- Pattern: `Stripe\(["']sk_live_` in frontend bundles
- Risk: Full access to Stripe account — read/write customers, charges, refunds, payouts
- Remediation: Secret keys must ONLY exist server-side. Client code uses the publishable key (`pk_live_` / `pk_test_`) only
- Severity: **Critical (10.0)**

**Payment Amount Set or Modified on Client Side**
- Pattern: `amount.*req\.body|price.*req\.body|total.*req\.body` passed directly to payment intent creation
- Pattern: `stripe\.paymentIntents\.create\(\{.*amount:.*req\.(body|query|params)`
- Pattern: Hidden form field `<input.*name=["']amount["']` or `data-amount` attribute editable in DOM
- Pattern: `paypal\.Buttons\(\{.*createOrder.*amount.*value:` with client-determined value
- Risk: Attacker modifies price to $0.01 before payment submission, pays arbitrary amount for any item
- Remediation: Always calculate price server-side from product ID and quantity; never trust client-submitted amounts
- Severity: **Critical (10.0)**

**PayPal: Missing IPN/Webhook Verification**
- Pattern: PayPal IPN handler without `cmd=_notify-validate` postback verification
- Pattern: PayPal webhook route without `paypal\.notification\.webhookEvent\.verify`
- Pattern: `paypal.*webhook` route that reads body without signature validation
- Risk: Forged payment notifications can grant products/services without actual payment
- Remediation: Verify IPN by posting back to PayPal; verify webhooks using PayPal SDK signature verification
- Severity: **Critical (9.8)**

**Braintree: Server-Side Amount Not Verified**
- Pattern: `gateway\.transaction\.sale\(\{.*amount:.*req\.body`
- Pattern: Braintree transaction created with client-supplied amount without server-side price lookup
- Risk: Client modifies transaction amount before submission
- Remediation: Look up item price server-side; never accept amount from client request body
- Severity: **Critical (9.5)**

### High

**Stripe: Payment Intent Amount Tampering**
- Pattern: `paymentIntents\.update\(` with amount from user input
- Pattern: Payment intent created early, then amount updated from client request before confirmation
- Risk: Attacker intercepts and modifies the amount between creation and confirmation
- Remediation: Create payment intent with server-calculated amount at time of confirmation; re-validate amount on webhook receipt
- Severity: **High (8.5)**

**Square: Missing Webhook Signature Verification**
- Pattern: Square webhook handler without `isValidWebhookEventSignature` or HMAC verification
- Pattern: `square.*webhook` route reading body without signature check
- Risk: Forged webhook events can manipulate order/payment state
- Remediation: Verify Square webhook signatures using `WebhooksHelper.isValidWebhookEventSignature()`
- Severity: **High (8.5)**

**Square: OAuth Token Mishandling**
- Pattern: `sq0atp-[a-zA-Z0-9_-]{22}` (access token) in client-side code or version control
- Pattern: Square OAuth tokens stored without encryption at rest
- Risk: Stolen token grants full API access to merchant account
- Remediation: Store OAuth tokens encrypted server-side; rotate regularly; use short-lived tokens with refresh flow
- Severity: **High (8.0)**

**Missing Idempotency Keys on Payment Endpoints**
- Pattern: `paymentIntents\.create\(` without `idempotencyKey` parameter
- Pattern: Payment creation endpoint without idempotency middleware or header check
- Pattern: `gateway\.transaction\.sale\(` without duplicate-detection logic
- Risk: Network retries or user double-clicks create duplicate charges
- Remediation: Require idempotency keys on all payment creation requests; Stripe supports `idempotencyKey` param natively
- Severity: **High (7.5)**

**Braintree: Client Token Exposure**
- Pattern: `gateway\.clientToken\.generate\(\)` result cached or logged
- Pattern: Braintree client token in HTML source without per-session generation
- Risk: Reused client tokens can be replayed; excessive token lifetime increases attack window
- Remediation: Generate a fresh client token per checkout session; never cache or log tokens
- Severity: **High (7.0)**

### Medium

**Stripe: Publishable Key Confusion**
- Pattern: Using `pk_test_` in production environment or `pk_live_` in test environment
- Pattern: `STRIPE_PUBLISHABLE_KEY` not environment-scoped (same key in dev and prod configs)
- Risk: Test mode in production means payments are not real; live key in dev leaks production data
- Remediation: Use environment-specific keys; validate key prefix matches environment at startup
- Severity: **Medium (6.0)**

**PayPal: Order Amount Not Validated Server-Side**
- Pattern: PayPal `onApprove` handler that calls `actions.order.capture()` without server-side amount check
- Pattern: Server capture endpoint that does not compare captured amount with expected order total
- Risk: Client modifies order amount before PayPal approval; server captures tampered amount
- Remediation: After capture, verify `purchase_units[0].amount.value` matches expected server-side total
- Severity: **Medium (6.5)**

### Low

**Test Keys in Production Config**
- Pattern: `sk_test_|pk_test_|sandbox|PAYPAL_SANDBOX` in production config files
- Pattern: Test API keys in `.env.production` or production deployment scripts
- Risk: Payments processed in test mode; no real charges collected
- Remediation: Audit environment configs; use CI/CD checks to block test keys in production
- Severity: **Low (3.0)**

---

## E-commerce Business Logic Flaws

### Critical

**Cart Price Manipulation**
- Pattern: `cart.*price|price.*cart` accepted from client-side POST/PUT body
- Pattern: `<input.*name=["']price["']` or `data-price` editable in cart forms
- Pattern: Cart API accepts `{ productId, quantity, price }` where price is client-supplied
- Risk: Attacker changes item price to $0 in request, pays nothing
- Remediation: Cart must look up price server-side by product ID; ignore any client-submitted price field
- Severity: **Critical (9.5)**

**Race Condition in Checkout (Double-Spend)**
- Pattern: Checkout endpoint without database-level locking or transaction isolation
- Pattern: `if (inventory > 0) { inventory -= 1 }` without `SELECT ... FOR UPDATE` or atomic decrement
- Pattern: Stock check and stock decrement in separate, non-atomic operations
- Risk: Concurrent requests purchase same last item; inventory goes negative; double charges
- Remediation: Use database transactions with `SELECT ... FOR UPDATE` or atomic operations (`UPDATE ... SET stock = stock - 1 WHERE stock > 0`)
- Severity: **Critical (9.0)**

**Coupon/Discount Abuse**
- Pattern: Coupon endpoint without server-side usage-count check or user-binding
- Pattern: `discount.*percent|percent.*discount` accepted from client request body
- Pattern: Negative discount value not validated (`discount: -50` adds money to order)
- Pattern: No check for coupon stacking (`applyCoupon` callable multiple times)
- Risk: Unlimited coupon reuse, negative discounts creating credits, stacking 100%+ off
- Remediation: Validate coupon server-side; track usage per user; reject negative values; enforce stacking rules; use atomic coupon redemption
- Severity: **Critical (9.0)**

### High

**Gift Card / Store Credit Balance Manipulation**
- Pattern: `balance.*req\.body|credit.*req\.body` on gift card redemption endpoint
- Pattern: Gift card balance checked and deducted in separate non-atomic queries
- Pattern: No server-side validation that gift card balance covers the applied amount
- Risk: Race condition to redeem same gift card multiple times; client-supplied balance amount
- Remediation: Use atomic balance deduction in a transaction; validate balance server-side before and during deduction
- Severity: **High (8.5)**

**Refund Fraud Vectors**
- Pattern: Refund endpoint without checking original payment status or amount
- Pattern: `refund.*amount.*req\.body` allowing arbitrary refund amounts exceeding original payment
- Pattern: No limit on number of refund requests per order
- Risk: Refund more than was paid; refund already-refunded orders; partial refund abuse
- Remediation: Validate refund amount <= original charge minus previous refunds; check order status; rate-limit refund requests
- Severity: **High (8.0)**

**Order Status Tampering**
- Pattern: `PUT /orders/:id` with `status` field accepted from client body
- Pattern: `order\.status = req\.body\.status` without role/state-machine validation
- Risk: Customer changes own order status to "shipped" or "refunded"
- Remediation: Use server-side state machine for order status; status transitions should be triggered by events, not client requests
- Severity: **High (8.0)**

**Currency Conversion Exploits**
- Pattern: Currency code accepted from client request (`currency: req.body.currency`)
- Pattern: Exchange rate not locked at time of order creation
- Pattern: No validation that payment currency matches order currency
- Risk: Attacker pays in a weaker currency; exploits rounding errors; arbitrages rate changes between order creation and payment
- Remediation: Lock currency and rate at order creation; validate payment currency matches order; reject client-supplied currency codes
- Severity: **High (7.5)**

### Medium

**Inventory Manipulation**
- Pattern: Stock quantity modifiable via public API endpoint
- Pattern: `PUT /products/:id` with `stock` or `inventory` field accepted without admin auth
- Pattern: Cart holds inventory indefinitely (no reservation timeout)
- Risk: Attacker depletes inventory via phantom carts; unauthorized stock modifications
- Remediation: Require admin auth for inventory updates; implement cart reservation timeouts (15-30 min); validate stock at checkout
- Severity: **Medium (6.5)**

**Shipping Address Bypass**
- Pattern: Shipping cost calculated client-side or from client-supplied address data without server revalidation
- Pattern: Free shipping applied based on client-side flag (`freeShipping: true` in request body)
- Risk: Attacker sets shipping to $0 or ships to unintended address post-payment
- Remediation: Calculate shipping server-side from validated address; lock shipping address at payment time
- Severity: **Medium (6.0)**

**Missing CSRF Protection on Checkout**
- Pattern: Checkout POST endpoint without CSRF token validation
- Pattern: Add-to-cart and purchase endpoints without `csrf`, `_token`, or `X-CSRF-Token` check
- Risk: Attacker tricks authenticated user into purchasing items via crafted page
- Remediation: Add CSRF tokens to all state-changing checkout endpoints; use SameSite cookies
- Severity: **Medium (5.5)**

### Low

**Cart Quantity Bounds Not Enforced**
- Pattern: No max quantity validation on cart add/update endpoint
- Pattern: Negative quantity accepted (`quantity: -1` reduces total)
- Risk: Integer overflow; negative totals; inventory logic errors
- Remediation: Enforce 1 <= quantity <= max_allowed; reject zero and negative values server-side
- Severity: **Low (3.5)**

---

## PCI-DSS Compliance

### Critical

**Credit Card Numbers in Logs**
- Pattern: `console\.log.*card|logger\.(info|debug|warn|error).*card|log\.(info|debug).*card`
- Pattern: `\b[3-6]\d{3}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b` in log output or log configuration
- Pattern: Request body logged without field redaction on payment endpoints
- PCI Ref: Requirement 3.4 — render PAN unreadable wherever it is stored
- Risk: Card numbers in logs are accessible to developers, log aggregation systems, SIEM tools — all out of PCI scope
- Remediation: Never log full card numbers; mask to last 4 digits; use structured logging with field-level redaction
- Severity: **Critical (10.0)**

**Storing CVV/CVC**
- Pattern: `cvv|cvc|security_code|card_code` in database schema, model definitions, or storage code
- Pattern: `CREATE TABLE.*(cvv|cvc|security_code)` in migrations
- Pattern: CVV field in any persistent storage (database, file, cache)
- PCI Ref: Requirement 3.2 — sensitive authentication data must not be stored after authorization
- Risk: Storing CVV is NEVER permitted under PCI-DSS, even if encrypted
- Remediation: Remove CVV storage entirely; pass CVV directly to payment processor; never persist it
- Severity: **Critical (10.0)**

**Card Data in Client-Side Storage**
- Pattern: `localStorage\.setItem\(.*card|sessionStorage\.setItem\(.*card`
- Pattern: `document\.cookie.*card|setCookie.*card`
- Pattern: Card data in IndexedDB, WebSQL, or client-side cache
- Risk: XSS attack exfiltrates stored card data; browser extensions can read storage
- Remediation: Never store card data client-side; use tokenized payment elements (Stripe Elements, PayPal Hosted Fields)
- Severity: **Critical (9.8)**

**Card Numbers in URL Parameters**
- Pattern: `\?.*card_number=|\?.*cc=|\?.*pan=|\&card_number=`
- Pattern: GET request with card data in query string
- Risk: Card numbers logged in server access logs, browser history, referrer headers, proxy logs
- Remediation: Never transmit card data via URL parameters; use POST with encrypted body
- Severity: **Critical (9.5)**

### High

**Missing PCI-Compliant Card Input**
- Pattern: `<input.*name=["'](card|cc|credit).*number|<input.*type=["']text["'].*card`
- Pattern: Custom card number input field instead of Stripe Elements, PayPal Hosted Fields, Braintree Drop-In, or Square Web Payments SDK
- Pattern: Raw card number collected in form and sent to own server before tokenization
- Risk: Handling raw card data puts the merchant in PCI-DSS SAQ D scope (most burdensome); any vulnerability exposes card data
- Remediation: Use payment processor hosted/embedded fields that tokenize on the provider's domain; this keeps card data off your servers entirely
- Severity: **High (8.5)**

**Card Data Transmitted Over Non-TLS**
- Pattern: `http://` (not `https://`) in payment form action or API endpoint URL
- Pattern: Payment endpoints served without TLS; missing HSTS headers
- PCI Ref: Requirement 4.1 — use strong cryptography for transmission of cardholder data over open networks
- Risk: Card data intercepted in transit via MITM attack
- Remediation: Enforce HTTPS everywhere; add HSTS header; redirect HTTP to HTTPS; use TLS 1.2+
- Severity: **High (8.0)**

**Card Data in Error Messages / Stack Traces**
- Pattern: Error handler that dumps full request body on payment endpoints
- Pattern: `JSON\.stringify(req\.body)` in catch block of payment route
- Pattern: Stack trace includes card data from failed validation
- Risk: Card numbers exposed in error monitoring tools (Sentry, Datadog, etc.), user-facing error pages
- Remediation: Sanitize error payloads on payment routes; redact card fields before logging or reporting errors
- Severity: **High (7.5)**

### Medium

**Test Card Numbers in Production Code**
- Pattern: `4242424242424242|4111111111111111|5555555555554444|378282246310005`
- Pattern: Test card numbers hardcoded in source (not in test files)
- Risk: Indicates test payment flow reachable in production; may allow fake purchases
- Remediation: Ensure test card numbers only exist in test files; production Stripe/PayPal rejects them automatically in live mode
- Severity: **Medium (5.0)**

---

## Shopify App Security

### Critical

**Missing HMAC Validation on Shopify Webhooks**
- Pattern: Shopify webhook route without `crypto\.timingSafeEqual` or HMAC verification
- Pattern: Webhook handler that reads `req.body` without checking `X-Shopify-Hmac-SHA256` header
- Pattern: `shopify.*webhook` route without `verifyWebhookHmac|validateHmac|verify.*signature`
- Risk: Attacker sends forged webhook events to manipulate orders, inventory, or app state
- Remediation: Verify HMAC using `crypto.createHmac('sha256', secret).update(rawBody).digest('base64')` and compare with `X-Shopify-Hmac-SHA256` using `timingSafeEqual`
- Severity: **Critical (9.5)**

**OAuth Callback Without State Verification**
- Pattern: Shopify OAuth callback (`/auth/callback`) without validating `state` parameter
- Pattern: `shopifyApi\.auth\.callback` or custom callback without CSRF/state check
- Pattern: No comparison of returned `state` with stored session state
- Risk: CSRF on OAuth flow — attacker links victim's store to attacker's app session
- Remediation: Generate random `state` on auth initiation, store in session, verify on callback
- Severity: **Critical (9.0)**

### High

**Missing Nonce Validation on Embedded Apps**
- Pattern: Shopify embedded app loading without verifying session token nonce
- Pattern: App Bridge session token accepted without server-side JWT verification
- Pattern: `shopify\.auth\.getSession` not called or return value not checked
- Risk: Session replay attacks; unauthorized access to merchant data
- Remediation: Verify session token JWT signature and claims (iss, dest, nbf, exp) on every authenticated request
- Severity: **High (8.0)**

**App Proxy Request Validation Missing**
- Pattern: App proxy endpoint (`/apps/proxy/`) without signature verification
- Pattern: Proxy route handler that does not validate `signature` query parameter
- Risk: Attacker accesses app proxy endpoints directly, bypassing Shopify's storefront context
- Remediation: Validate app proxy signature using HMAC of sorted query parameters (excluding signature itself)
- Severity: **High (7.5)**

**Excessive OAuth Scopes Requested**
- Pattern: Shopify OAuth scope list includes `write_customers`, `write_orders`, `read_all_orders` when not needed
- Pattern: Scopes requested at install time far exceed app functionality
- Risk: If app is compromised, attacker has broad access to merchant data; violates principle of least privilege
- Remediation: Request only scopes the app actively uses; document justification for each scope
- Severity: **High (7.0)**

### Medium

**Embedded App Security (App Bridge)**
- Pattern: Shopify App Bridge initialized without `forceRedirect: true` in production
- Pattern: Embedded app accessible outside Shopify admin iframe (no `X-Frame-Options` or `frame-ancestors` check)
- Pattern: `shopify-app-bridge` not verifying host parameter
- Risk: App can be framed outside Shopify admin; clickjacking; phishing via fake admin context
- Remediation: Enable `forceRedirect`; verify the `host` param on load; set `Content-Security-Policy: frame-ancestors https://*.myshopify.com https://admin.shopify.com`
- Severity: **Medium (6.0)**

### Low

**Session Token Not Rotated**
- Pattern: Shopify session stored without expiry or rotation logic
- Pattern: Long-lived offline access tokens stored without encryption
- Risk: Stale sessions; token theft has extended impact
- Remediation: Implement session rotation; encrypt stored access tokens; honor token expiry
- Severity: **Low (3.5)**

---

## General E-commerce Security

### High

**Admin Panel Exposure**
- Pattern: `/admin|/dashboard|/wp-admin|/manager|/backoffice` accessible without authentication
- Pattern: Admin routes not behind VPN, IP allowlist, or strong auth
- Pattern: Default admin credentials not changed (`admin/admin`, `admin/password`)
- Risk: Unauthorized access to order management, customer data, financial reports, product control
- Remediation: Protect admin with MFA; restrict by IP/VPN; use strong unique credentials; remove default accounts
- Severity: **High (8.5)**

**Order Information Disclosure (IDOR)**
- Pattern: `/orders/:id` or `/api/orders/:id` without ownership check
- Pattern: Sequential numeric order IDs (`/orders/1001`, `/orders/1002`)
- Pattern: `Order\.findById\(req\.params\.id\)` without `where: { userId: req.user.id }` filter
- Risk: Attacker enumerates order IDs to view other customers' orders, addresses, and purchase details
- Remediation: Use UUIDs for order identifiers; always filter queries by authenticated user ID; return 404 (not 403) for unauthorized access
- Severity: **High (8.0)**

**User Impersonation in Orders**
- Pattern: `userId` or `customerId` accepted from request body on order creation
- Pattern: `createOrder({ userId: req.body.userId })` instead of `createOrder({ userId: req.user.id })`
- Risk: Attacker places orders under another user's account or accesses their payment methods
- Remediation: Always derive user identity from authenticated session, never from request body
- Severity: **High (8.0)**

**Email Enumeration via Forgot Password**
- Pattern: Forgot password endpoint returns different responses for existing vs. non-existing emails
- Pattern: `if (!user) return res.status(404).json({ error: "User not found" })`
- Pattern: Different response timing for existing vs. non-existing accounts
- Risk: Attacker builds list of valid customer emails for phishing, credential stuffing, or spam
- Remediation: Return identical response regardless of email existence ("If an account exists, you will receive a reset email"); normalize response timing
- Severity: **High (7.0)**

### Medium

**Webhook Replay Attacks**
- Pattern: Webhook handler without timestamp validation
- Pattern: No check that webhook event timestamp is within acceptable window (e.g., 5 minutes)
- Pattern: No idempotency check on webhook event ID (same event processed multiple times)
- Risk: Captured webhook payloads replayed to trigger duplicate order fulfillment or payment crediting
- Remediation: Validate event timestamp; reject events older than 5 minutes; track processed event IDs to prevent replay
- Severity: **Medium (6.5)**

**Product Price History Not Audited**
- Pattern: Product price updates without audit log or changelog
- Pattern: `UPDATE products SET price =` without recording who changed it and when
- Risk: Insider threat — employee modifies prices temporarily for personal purchases, reverts after
- Remediation: Log all price changes with timestamp, actor, old value, and new value; alert on unusual patterns
- Severity: **Medium (5.5)**

### Low

**Missing Order Rate Limiting**
- Pattern: No rate limit on checkout or order creation endpoint
- Pattern: Order API allows unlimited requests per user per time window
- Risk: Automated purchasing bots; inventory hoarding; denial of service on checkout flow
- Remediation: Rate limit order creation per user (e.g., 5 orders per minute); implement CAPTCHA on checkout for suspicious patterns
- Severity: **Low (3.5)**

**Insufficient Product Validation**
- Pattern: Product creation/update API without field length limits or type validation
- Pattern: Product descriptions accepting raw HTML without sanitization
- Risk: XSS in product pages; stored XSS via admin-injected content; excessively large payloads
- Remediation: Validate and sanitize all product fields; set field length limits; sanitize HTML content
- Severity: **Low (3.0)**
