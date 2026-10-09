# API Security Checks

Reference file for REST API, GraphQL, gRPC, and WebSocket security patterns. Used across Phases 4 and 7.

---

## REST API Security

### Critical

**Mass Assignment / Over-Posting**
- Pattern (Express): `Object\.assign\(.*req\.body\)|\.create\(req\.body\)|\.update\(req\.body\)|spread.*req\.body`
- Pattern (Django): `serializer_class.*=.*ModelSerializer` without `fields` or with `fields = '__all__'`
- Pattern (Rails): `params\.permit!|permit\(.*:role|:admin|:is_admin|:is_superuser`
- Pattern (Spring): `@RequestBody` mapped directly to entity without DTO
- Remediation: Use explicit field allowlists; never pass raw request body to ORM create/update

**No Authentication on Sensitive Endpoints**
- Pattern: POST/PUT/DELETE/PATCH routes without auth middleware
- Check: Compare route definitions against middleware chain
- Remediation: Add authentication middleware to all non-public endpoints

### High

**Missing Input Validation**
- Pattern (Express): Route handler reads `req.body.*` without prior validation middleware
- Check for: `joi`, `yup`, `zod`, `ajv`, `express-validator`, `class-validator` usage
- Pattern (Django): No `serializer.is_valid()` call before using data
- Pattern (FastAPI): Endpoints without Pydantic model type hints
- Pattern (Spring): No `@Valid` or `@Validated` on `@RequestBody`
- Remediation: Validate all input with schema validation library

**Missing Rate Limiting**
- Pattern: No rate limiting middleware on any endpoint
- Check for: `express-rate-limit`, `bottleneck`, `ratelimit` (Django), `@RateLimiter` (Spring)
- Specific endpoints that MUST have rate limiting:
  - `/login`, `/auth`, `/token` — prevent brute force
  - `/register`, `/signup` — prevent mass account creation
  - `/forgot-password`, `/reset-password` — prevent enumeration
  - `/api/*` — prevent API abuse
- Remediation: Add rate limiting middleware; start with 100 req/min general, 5 req/min for auth

**Missing Request Size Limits**
- Pattern (Express): No `express.json({ limit: })` or `bodyParser({ limit: })`
- Pattern (nginx): No `client_max_body_size` directive
- Risk: Large payload DoS, zip bomb attacks
- Remediation: Set request body limit (e.g., 1MB for JSON, 10MB for file uploads)

**Missing Response Pagination**
- Pattern: Endpoints returning arrays without `limit`/`offset` or cursor pagination
- Pattern: `SELECT * FROM` without `LIMIT` in list endpoints
- Risk: Memory exhaustion, data exfiltration via bulk download
- Remediation: Enforce server-side pagination with maximum page size

### Medium

**Inconsistent Error Responses**
- Pattern: Different error formats across endpoints (some return stack traces, some return codes)
- Pattern: `catch (err) { res.status(500).json(err) }` — leaks internal errors
- Remediation: Use centralized error handler; return consistent error schema

**Missing HATEOAS / Versioning**
- Pattern: No API version in URL (`/api/v1/`) or headers
- Risk: Breaking changes affect all clients
- Remediation: Version APIs; use `/api/v1/` or `Accept: application/vnd.api.v1+json`

**Verbose HTTP Methods**
- Pattern: `app.all()` or router accepting all methods when only specific ones are needed
- Pattern: OPTIONS/TRACE methods not explicitly disabled
- Remediation: Only enable required HTTP methods per endpoint

### Low

**Missing API Documentation**
- Pattern: No `swagger.json`, `openapi.yaml`, or API docs route
- Remediation: Add OpenAPI spec; serves as both documentation and validation contract

---

## GraphQL Security

### Critical

**No Query Depth Limiting**
- Pattern: GraphQL server without `depthLimit` or equivalent
- Check for: `graphql-depth-limit`, `graphql-validation-complexity`, `envelop` plugins
- Risk: Deeply nested queries cause exponential server load
- Example attack: `{ user { posts { comments { author { posts { comments { ... } } } } } } }`
- Remediation: Set max depth limit (typically 7-10 levels)

**No Query Complexity/Cost Analysis**
- Pattern: No complexity limiting plugin
- Check for: `graphql-query-complexity`, `graphql-cost-analysis`
- Risk: Expensive queries regardless of depth (e.g., `{ allUsers(first: 1000000) { ... } }`)
- Remediation: Assign cost to fields and enforce maximum query cost

**Introspection Enabled in Production**
- Pattern: No `introspection: false` in production GraphQL config
- Pattern (Apollo): `new ApolloServer({ introspection: true })` or no setting (defaults to true)
- Risk: Attackers can map entire schema
- Remediation: Disable introspection in production — `introspection: process.env.NODE_ENV !== 'production'`

### High

**Missing Authorization on Resolvers**
- Pattern: Resolvers without auth checks
- Pattern: No `@auth` directive or auth middleware in resolver chain
- Remediation: Add authorization to every resolver (field-level, not just type-level)

**No Batching/Aliasing Limits**
- Pattern: No limit on query aliases or batch mutations
- Risk: Brute force via aliased queries: `{ a: login(pw: "a"), b: login(pw: "b"), ... }`
- Remediation: Limit aliases per query; limit batch size

**Exposed Error Details**
- Pattern: `formatError` not configured or passes through original error
- Risk: Stack traces, database errors leaked to client
- Remediation: Sanitize errors in `formatError` function

### Medium

**Missing Persisted Queries**
- Pattern: Server accepts arbitrary query strings (not just persisted query hashes)
- Risk: Reduces ability to control query patterns; enables injection
- Remediation: Use automatic persisted queries (APQ) in production

**No Rate Limiting per Operation**
- Pattern: Rate limiting on the GraphQL endpoint but not per operation type
- Risk: Expensive mutations or queries bypass general rate limits
- Remediation: Rate limit by operation name/type

---

## WebSocket Security

### Critical

**No Authentication on Connection**
- Pattern: WebSocket server without auth check in `connection`/`upgrade` handler
- Pattern (ws): `wss.on('connection', (ws) => {` without token/session validation
- Pattern (Socket.io): No `io.use()` auth middleware
- Remediation: Validate auth token/session on connection upgrade; reject unauthorized connections

### High

**No Origin Validation**
- Pattern: WebSocket accepts connections from any origin
- Pattern: No `verifyClient` callback (ws library)
- Pattern (Socket.io): `cors: { origin: '*' }`
- Remediation: Validate origin against allowlist

**No Message Validation**
- Pattern: Incoming messages parsed without schema validation
- Pattern: `JSON.parse(message)` used directly without validation
- Risk: Injection via WebSocket messages
- Remediation: Validate all incoming messages against expected schema

**No Rate Limiting on Messages**
- Pattern: No throttle on incoming WebSocket messages
- Risk: Message flooding DoS
- Remediation: Implement per-connection message rate limiting

### Medium

**No Heartbeat/Timeout**
- Pattern: WebSocket connections without ping/pong timeout
- Risk: Zombie connections consuming resources
- Remediation: Implement heartbeat mechanism; close idle connections

---

## gRPC Security

### High

**No TLS (Insecure Channel)**
- Pattern (Go): `grpc.Dial(.*grpc\.WithInsecure\(\))`
- Pattern (Python): `grpc.insecure_channel\(`
- Pattern (Java): `ManagedChannelBuilder.*usePlaintext\(\)`
- Remediation: Always use TLS — `grpc.WithTransportCredentials(credentials.NewTLS(...))`

**No Authentication**
- Pattern: gRPC server without interceptor/middleware for auth
- Pattern: No `UnaryInterceptor` or `StreamInterceptor` for token validation
- Remediation: Add auth interceptor that validates JWT/mTLS on every RPC

**No Input Validation**
- Pattern: Protobuf messages used directly without business validation
- Note: Protobuf provides type safety but not business rule validation
- Remediation: Validate message fields in service implementation

### Medium

**No Deadline/Timeout**
- Pattern: gRPC calls without context deadline
- Pattern (Go): `context.Background()` without `context.WithTimeout`
- Risk: Slow/hanging RPCs consume server resources
- Remediation: Set deadlines on all RPC calls

**Reflection Enabled in Production**
- Pattern (Go): `reflection.Register(grpcServer)` without env guard
- Risk: Attackers can discover all available services
- Remediation: Disable reflection in production

---

## API Key Security

### High

**API Key in URL Query Parameter**
- Pattern: `[?&](api_key|apikey|key|token|access_token)=`
- Risk: Keys logged in access logs, cached by proxies, visible in browser history
- Remediation: Pass API keys in `Authorization` header or custom header (`X-API-Key`)

**No Key Scoping**
- Pattern: Single API key grants access to all endpoints
- Remediation: Scope keys to specific permissions/resources

**No Key Expiration**
- Pattern: API keys without TTL or rotation mechanism
- Remediation: Set key expiration; provide rotation endpoint

### Medium

**No Key Hashing at Rest**
- Pattern: API keys stored in plaintext in database
- Remediation: Store only hashed keys (SHA-256 of key); compare hashes on lookup

---

## Common API Vulnerabilities — Cross-Cutting

### Broken Object Level Authorization (BOLA)
- OWASP API Top 10 #1
- Pattern: `GET /api/users/:id` returns data for any ID without ownership check
- Pattern: `findById(req.params.id)` without `where: { userId: req.user.id }`
- Remediation: Always verify the requesting user owns/has access to the resource

### Broken Function Level Authorization
- OWASP API Top 10 #5
- Pattern: Admin endpoints accessible with regular user token
- Pattern: No role check on `DELETE`, `PUT` operations
- Remediation: Check permissions at function/route level, not just authentication

### Unrestricted Resource Consumption
- OWASP API Top 10 #4
- Pattern: No limits on: request size, pagination size, file upload size, batch operations
- Remediation: Set explicit limits on all resource-consuming operations

### Server Side Request Forgery (SSRF)
- OWASP API Top 10 #7
- Pattern: API accepts URL parameter and fetches it server-side
- Pattern: Webhook URL registration without validation
- Remediation: Validate URLs against allowlist; block private IP ranges
