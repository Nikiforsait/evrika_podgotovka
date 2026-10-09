# Microservices Architecture Security Checks

Reference file for microservices-specific security patterns. Covers service-to-service auth, API gateway security, secret management, message queues, container orchestration, distributed system concerns, and cross-service data security.

---

## Service-to-Service Authentication

### Critical

**No Authentication Between Services**
- Pattern (code): Services making HTTP calls without auth headers — `fetch\(.*localhost:\d+|axios\.(get|post)\(.*:(?:3\d{3}|8\d{3})` without `Authorization`
- Pattern (docker-compose): Services on same network with no auth middleware — `networks:.*internal` with no sidecar or auth config
- Risk: Any compromised service can call any other service freely; lateral movement is trivial
- Remediation: Implement mTLS or JWT-based service-to-service auth; use a service mesh for automated enforcement

**Missing mTLS for Internal Communication**
- Pattern (K8s): Services communicating over plain HTTP internally — `http://.*\.svc\.cluster\.local`
- Pattern (Istio): `PeerAuthentication` missing or set to `PERMISSIVE` — `mode:\s*PERMISSIVE|mode:\s*DISABLE`
- Pattern (Linkerd): Missing `linkerd.io/inject: enabled` annotation on namespaces
- Risk: Internal traffic can be sniffed or tampered with; pod-to-pod communication is unencrypted
- Remediation: Enable strict mTLS in service mesh — set `mode: STRICT` in PeerAuthentication; inject sidecar proxies on all workloads

**Shared Secrets/API Keys Across Services**
- Pattern: Same API key or token value appearing in multiple service configs — `API_KEY=\w{20,}` duplicated across `.env` files
- Pattern (K8s): Single Secret object mounted into multiple unrelated deployments
- Pattern: `INTERNAL_API_KEY|SHARED_SECRET|INTER_SERVICE_KEY` in environment variables
- Risk: Compromise of one service exposes the shared credential; no way to revoke access for a single service
- Remediation: Issue per-service credentials with unique identities; use short-lived tokens via OIDC or SPIFFE/SPIRE

### High

**JWT Propagation Without Per-Service Validation**
- Pattern: Services forwarding JWT without verifying — `req\.headers\['authorization'\]` passed directly to downstream call without `jwt\.verify`
- Pattern: No JWT verification library imported — absence of `jsonwebtoken`, `jose`, `pyjwt`, `java-jwt` in service dependencies
- Risk: A tampered or expired JWT passes through the chain unchecked; authorization bypass at downstream services
- Remediation: Each service must validate the JWT signature, expiry, audience, and issuer before processing requests

**Service Mesh Without mTLS Enabled**
- Pattern (Istio): `meshConfig:.*mtls:.*mode:\s*DISABLE` or missing `PeerAuthentication` resources entirely
- Pattern (Consul): `connect.*enabled.*false|verify_incoming.*false|verify_outgoing.*false`
- Risk: Service mesh is deployed but not enforcing encryption; false sense of security
- Remediation: Enable mTLS globally — `PeerAuthentication` with `mode: STRICT`; audit with `istioctl analyze`

**Missing Service Identity Verification**
- Pattern: No SPIFFE/SPIRE configuration — absence of `spiffe://` URIs in trust domain config
- Pattern (K8s): Services not using `ServiceAccount` tokens for identity — `automountServiceAccountToken:\s*false` everywhere with no alternative
- Risk: Services cannot cryptographically prove their identity; impersonation attacks possible
- Remediation: Adopt SPIFFE-based identities via SPIRE or service mesh; verify caller identity on each request

---

## API Gateway Security

### Critical

**API Gateway Bypass — Services Directly Accessible**
- Pattern (K8s): Services with `type:\s*LoadBalancer|type:\s*NodePort` that should be internal-only
- Pattern (docker-compose): Internal services with published ports — `ports:\s*-\s*"\d+:\d+"` on non-gateway services
- Pattern (K8s): Missing `NetworkPolicy` restricting ingress to gateway only
- Risk: Attackers bypass all gateway controls (auth, rate limiting, WAF) by hitting services directly
- Remediation: Set internal services to `ClusterIP` only; enforce `NetworkPolicy` allowing ingress only from the gateway pod

**Gateway Not Validating Auth Before Forwarding**
- Pattern (nginx): `proxy_pass` without prior `auth_request` or JWT validation directive
- Pattern (Kong): Routes without `jwt` or `oauth2` plugin attached
- Pattern (AWS API Gateway): Methods without `authorizationType` — `"authorizationType":\s*"NONE"`
- Risk: Unauthenticated requests forwarded to backend services; relies entirely on backend auth
- Remediation: Enforce authentication at the gateway for all non-public routes; reject unauthenticated requests before forwarding

### High

**Missing Rate Limiting at Gateway**
- Pattern (nginx): No `limit_req_zone` or `limit_req` directives
- Pattern (Kong): No `rate-limiting` plugin in gateway config
- Pattern (AWS API Gateway): No usage plan or throttle configuration
- Pattern (Envoy): No `local_rate_limit` or `ratelimit` filter configured
- Risk: Upstream services overwhelmed by traffic; brute-force and credential stuffing attacks unmitigated
- Remediation: Configure rate limiting at gateway — per-IP and per-user; set burst limits for auth endpoints

**CORS Misconfigured at Gateway**
- Pattern: `Access-Control-Allow-Origin:\s*\*` or `allow_origins:.*\*` in gateway config
- Pattern (nginx): `add_header 'Access-Control-Allow-Origin' '*'`
- Pattern (Kong): `cors` plugin with `origins: ["*"]`
- Risk: Cross-origin requests from malicious sites can reach your APIs with user credentials
- Remediation: Restrict CORS origins to known domains; never use wildcard with `Access-Control-Allow-Credentials: true`

**Missing Request/Response Size Limits**
- Pattern (nginx): No `client_max_body_size` directive or set excessively high
- Pattern (Kong): No `request-size-limiting` plugin
- Pattern (Envoy): No `max_request_bytes` in `buffer_filter`
- Risk: Large payload DoS; memory exhaustion on backend services; zip bomb attacks
- Remediation: Set request body limits at gateway — 1MB for JSON APIs, explicit higher limits only where needed (file upload)

**Missing Circuit Breaker Patterns**
- Pattern (Envoy): No `outlier_detection` configured on clusters
- Pattern (Istio): No `DestinationRule` with `outlierDetection` field
- Pattern (code): No circuit breaker library — absence of `opossum`, `resilience4j`, `polly`, `hystrix` in dependencies
- Risk: Cascading failures across services lead to full system DoS; one slow service takes down everything
- Remediation: Configure circuit breakers with sensible thresholds; implement fallback responses; set request timeouts

### Medium

**Missing API Key Management at Gateway**
- Pattern: API keys hardcoded in gateway config — `apikey:\s*['"][A-Za-z0-9]{16,}['"]`
- Pattern: No API key rotation mechanism or key management plugin
- Risk: Leaked or stale API keys used indefinitely; no per-consumer tracking
- Remediation: Use gateway key management features; rotate keys regularly; tie keys to consumer identities

---

## Secret Management

### Critical

**Secrets Passed as Environment Variables**
- Pattern (docker-compose): `environment:.*(?:PASSWORD|SECRET|TOKEN|KEY)\s*[:=]`
- Pattern (K8s deployment): `env:.*name:\s*(?:DB_PASSWORD|SECRET_KEY|API_TOKEN).*value:\s*\S+` (inline value, not `valueFrom`)
- Pattern (shell): Secrets visible in `/proc/<pid>/environ` or `docker inspect`
- Risk: Environment variables visible in process lists, debug dumps, crash reports, and container metadata
- Remediation: Use mounted secret files or vault agent injection; reference K8s Secrets via `valueFrom.secretKeyRef`

**Secrets in Docker Compose or Kubernetes ConfigMaps**
- Pattern (docker-compose): `(?:PASSWORD|SECRET|TOKEN|KEY)\s*[:=]\s*\S+` in `docker-compose.yml` or `.yaml`
- Pattern (K8s): Sensitive data in `ConfigMap` instead of `Secret` — `kind:\s*ConfigMap` with `(?:password|secret|token|key)` in data keys
- Pattern: Secrets committed to version control in plain-text config files
- Risk: ConfigMaps are not encrypted at rest by default; secrets exposed in git history
- Remediation: Move sensitive values to K8s `Secret` resources with `encryptionConfiguration`; use sealed-secrets or external-secrets-operator

### High

**Missing Vault Integration**
- Pattern: No HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, or GCP Secret Manager references in codebase
- Pattern: Secrets managed as static files — `\.env|config\.json|application\.properties` containing credentials
- Pattern: No `vault-agent`, `external-secrets`, or `secrets-store-csi-driver` in K8s manifests
- Risk: Secrets are static, unaudited, and unrotated; no access logging or fine-grained policies
- Remediation: Integrate a secrets management solution; use dynamic secrets with TTLs where possible

**No Automated Secret Rotation**
- Pattern: Static credentials with no rotation config — secrets without `ttl`, `rotation_period`, or `rotation_lambda`
- Pattern (AWS): No `rotation_rules` in `aws_secretsmanager_secret_rotation` Terraform resources
- Risk: Long-lived credentials increase blast radius of compromise; stale credentials accumulate
- Remediation: Automate rotation with vault dynamic secrets or cloud-native rotation; set maximum credential lifetimes

**Service Account Keys Shared Across Services**
- Pattern (GCP): Same `service-account-key.json` mounted in multiple deployments
- Pattern (K8s): Single `ServiceAccount` used by many deployments — multiple `Deployment` specs referencing same `serviceAccountName`
- Risk: Over-privileged shared identity; cannot revoke access for individual services; audit trails are ambiguous
- Remediation: Create per-service `ServiceAccount` with minimal RBAC; use workload identity federation instead of key files

---

## Event-Driven / Message Queue Security

### Critical

**Kafka Without Authentication**
- Pattern: `security.protocol=PLAINTEXT` or absence of `security.protocol` in Kafka client config
- Pattern: No `sasl.mechanism` configured — missing `SASL_SSL|SASL_PLAINTEXT` in producer/consumer properties
- Pattern (docker-compose): `KAFKA_LISTENERS:.*PLAINTEXT` without any `SASL` listener
- Risk: Any network-reachable client can produce/consume messages; data theft and injection
- Remediation: Enable SASL/SCRAM or mTLS — set `security.protocol=SASL_SSL` and configure ACLs per topic

**RabbitMQ Default Credentials**
- Pattern: `amqp://guest:guest@|RABBITMQ_DEFAULT_USER.*guest|RABBITMQ_DEFAULT_PASS.*guest`
- Pattern: `credentials.*guest.*guest|ConnectionFactory.*guest`
- Risk: Default credentials grant full admin access; complete message queue compromise
- Remediation: Change default credentials immediately; disable `guest` user; use per-service accounts with vhost restrictions

**Message Queue Accessible from Public Network**
- Pattern (docker-compose): RabbitMQ/Kafka/Redis ports exposed — `ports:.*"(?:5672|9092|6379|4222):\d+"`
- Pattern (K8s): Message queue services with `type:\s*LoadBalancer|type:\s*NodePort`
- Pattern (security group/firewall): Ingress rules allowing `0.0.0.0/0` on queue ports
- Risk: Message queues directly reachable from the internet; authentication bypass or brute force possible
- Remediation: Restrict to internal networks only; use `ClusterIP` in K8s; apply strict firewall rules

### High

**SQS/SNS Without IAM Policy Restrictions**
- Pattern (Terraform): `aws_sqs_queue_policy` with `"Principal":\s*"\*"` or `"Effect":\s*"Allow".*"Principal":\s*"\*"`
- Pattern (Terraform): `aws_sns_topic_policy` with overly permissive `Principal`
- Pattern: Missing `Condition` blocks in queue/topic policies
- Risk: Any AWS principal can send/receive messages; cross-account data exfiltration
- Remediation: Restrict `Principal` to specific service roles; add `Condition` keys for source account/VPC

**Redis Pub/Sub Without AUTH**
- Pattern: `redis://localhost|redis://redis:6379` without password — no `?password=` or `AUTH` command
- Pattern: `requirepass` not set in `redis.conf`
- Pattern (docker-compose): Redis without `command: redis-server --requirepass`
- Risk: Any client on the network can subscribe to channels and read all published messages
- Remediation: Set `requirepass` in Redis config; use Redis 6+ ACLs for per-user channel restrictions; use TLS

**NATS Without Authentication**
- Pattern: NATS server config without `authorization` or `accounts` block
- Pattern: Client connecting without credentials — `nats\.connect\(['"]nats://` without `user_credentials` or `token`
- Risk: Unauthenticated publish/subscribe to all subjects; message injection and data exfiltration
- Remediation: Enable NATS authentication with NKeys or JWT-based auth; configure per-subject permissions

### Medium

**Missing Message Validation/Schema Enforcement**
- Pattern: Message consumers deserializing without schema validation — `JSON\.parse\(msg|json\.loads\(msg|objectMapper\.readValue` without subsequent validation
- Pattern: No Avro/Protobuf schema registry configured — absence of `schema.registry.url` in Kafka config
- Risk: Malformed or malicious messages cause crashes or injection attacks at consumer services
- Remediation: Use schema registry for Kafka; validate all consumed messages against schemas; reject invalid messages to DLQ

**Event Replay Attacks Without Idempotency**
- Pattern: Message handlers without idempotency checks — no deduplication key, no `messageId` tracking
- Pattern: No `idempotency_key` or `dedup_id` in message processing logic
- Risk: Replayed messages cause duplicate transactions, double charges, or repeated state mutations
- Remediation: Track processed message IDs; use idempotency keys; leverage exactly-once delivery semantics where available

**Dead Letter Queue Containing Unencrypted Sensitive Data**
- Pattern: DLQ without encryption — `aws_sqs_queue` for DLQ missing `kms_master_key_id`
- Pattern: DLQ messages logged in plain text for debugging — `console\.log.*deadLetter|logger.*dlq.*message`
- Risk: Failed messages containing PII or credentials accumulate in unencrypted, unmonitored queues
- Remediation: Encrypt DLQs at rest; set retention limits; redact sensitive fields before writing to DLQ; alert on DLQ depth

---

## Container Orchestration (Microservices-Specific)

### Critical

**Missing Network Segmentation Between Services**
- Pattern (K8s): No `NetworkPolicy` resources in namespace — `kubectl get networkpolicy -n <ns>` returns empty
- Pattern: Default `allow-all` network behavior with no deny policies
- Risk: Any pod can communicate with any other pod; compromised service has full lateral movement
- Remediation: Implement default-deny `NetworkPolicy`; explicitly allow only required service-to-service flows

**Sidecar Containers with Excessive Privileges**
- Pattern: Sidecar with `securityContext:.*privileged:\s*true`
- Pattern: Sidecar with `capabilities:.*add:.*(?:SYS_ADMIN|NET_ADMIN|SYS_PTRACE|ALL)`
- Risk: Compromised sidecar can escalate to node-level access; read other containers' memory/network
- Remediation: Run sidecars with minimal capabilities; drop ALL capabilities and add only what is required

### High

**Init Containers Running as Root**
- Pattern: `initContainers:` block without `securityContext:.*runAsNonRoot:\s*true`
- Pattern: `initContainers:.*runAsUser:\s*0`
- Risk: Init containers with root access can modify volumes, install backdoors, or alter config before main container starts
- Remediation: Run init containers as non-root where possible; use read-only filesystem; limit capabilities

**Shared Volumes Between Untrusted Services**
- Pattern: Same `PersistentVolumeClaim` mounted in multiple pods from different services — same `claimName` across deployments
- Pattern: `hostPath` volumes shared between containers — `hostPath:.*path:\s*/` or shared sensitive paths
- Risk: One service can read/modify another service's data; path traversal across trust boundaries
- Remediation: Use dedicated PVCs per service; avoid `hostPath`; use `readOnly: true` where writes are not needed

**Service Account Token Auto-Mounting When Not Needed**
- Pattern: Pods without `automountServiceAccountToken:\s*false` that do not need K8s API access
- Pattern: Default `ServiceAccount` used without disabling token mount
- Risk: Compromised pod can use the mounted token to query the K8s API; potential cluster-wide escalation
- Remediation: Set `automountServiceAccountToken: false` on pods and service accounts that do not need API access

### Medium

**Missing Pod Security Standards**
- Pattern: No `PodSecurityPolicy`, `PodSecurity` admission, or OPA/Kyverno policies
- Pattern: Namespace without `pod-security.kubernetes.io/enforce` label
- Risk: No baseline enforcement; containers can run as root, mount host filesystem, or escalate privileges
- Remediation: Apply `restricted` Pod Security Standard; use Kyverno or OPA Gatekeeper for custom policies

---

## Distributed System Concerns

### High

**Inconsistent Auth Enforcement Across Services**
- Pattern: Some services import auth middleware, some do not — inconsistent presence of `auth`, `jwt`, `passport`, `spring-security` across services
- Pattern: Services with auth bypass flags — `SKIP_AUTH=true|AUTH_ENABLED=false|DISABLE_AUTH`
- Risk: Attackers target the weakest service; inconsistent enforcement creates gaps in the security perimeter
- Remediation: Enforce auth at the mesh/sidecar level rather than relying on each service; audit all services for consistent middleware

**Health Check Endpoints Leaking Internal Info**
- Pattern: `/health|/status|/info|/actuator/health|/actuator/info|/actuator/env` returning detailed system info
- Pattern (Spring): `management.endpoints.web.exposure.include=\*|management.endpoint.env.enabled=true`
- Pattern: Health endpoints returning database connection strings, version numbers, or internal IPs
- Risk: Attackers enumerate internal architecture, versions, and dependencies; aids targeted exploitation
- Remediation: Return minimal health status (`{"status":"ok"}`); restrict actuator endpoints to internal network; disable `/actuator/env`

**Service Discovery Without Authentication**
- Pattern (Consul): `acl.*enabled.*false|acl_default_policy.*allow` in Consul agent config
- Pattern (etcd): `--client-cert-auth=false` or etcd listening on `0.0.0.0` without TLS
- Pattern: Consul/etcd/Eureka UI accessible without authentication
- Risk: Attackers enumerate all services and endpoints; modify service registry to redirect traffic
- Remediation: Enable ACLs on Consul; use TLS client certificates for etcd; restrict service discovery to authenticated clients

**gRPC Reflection Enabled in Production**
- Pattern: `grpc\.reflection\.v1alpha\.ServerReflection|reflection\.Register|grpc_reflection_v1alpha`
- Pattern (Go): `reflection\.Register\(` in non-test files
- Pattern (Java): `ProtoReflectionService\.newInstance\(\)` in server setup
- Risk: Attackers enumerate all RPC methods, message types, and service definitions; aids reconnaissance
- Remediation: Disable gRPC reflection in production; enable only in development/staging environments

### Medium

**Missing Distributed Tracing**
- Pattern: No tracing library — absence of `opentelemetry`, `jaeger-client`, `zipkin`, `datadog-trace`, `@opentelemetry/sdk-trace` in dependencies
- Pattern: No trace context propagation headers — `traceparent|x-b3-traceid|x-request-id` not forwarded between services
- Risk: Cannot trace request flows across services; security incidents impossible to investigate end-to-end
- Remediation: Instrument all services with OpenTelemetry; propagate trace context in all inter-service calls; export to centralized collector

**Missing Centralized Logging**
- Pattern: Services logging only to stdout/files with no log aggregator configured
- Pattern: No Fluentd, Fluent Bit, Filebeat, or Vector sidecar/daemonset in K8s
- Pattern: Missing correlation IDs — no `x-request-id|x-correlation-id|traceId` in log output
- Risk: Cannot correlate events across services during incident response; security audit gaps; no alerting on cross-service attack patterns
- Remediation: Deploy centralized logging (ELK, Loki, Datadog); include correlation IDs in all log entries; set up security alerts

**Missing Request Deadline/Timeout Propagation**
- Pattern: No `grpc-timeout` header propagation in gRPC calls
- Pattern: HTTP calls without timeout — `fetch\(|axios\.(get|post)\(|requests\.(get|post)\(` without `timeout` parameter
- Pattern: No deadline propagation — missing `context.WithTimeout|setTimeout|AbortController`
- Risk: Slow downstream services cause upstream services to hang; resource exhaustion; chain-reaction failures
- Remediation: Set and propagate deadlines on all inter-service calls; use context cancellation; fail fast

### Low

**Missing Request Flow Documentation**
- Pattern: No service dependency diagram or architecture docs
- Risk: Teams cannot reason about data flow or trust boundaries; security review is ad hoc
- Remediation: Maintain service dependency maps; document trust boundaries and data classification per service

---

## Cross-Service Data Security

### Critical

**PII Flowing Through Services Without Encryption**
- Pattern: Sensitive fields in plain text across service calls — `email|ssn|credit_card|password|date_of_birth` in JSON payloads over HTTP (not HTTPS internally)
- Pattern: Log statements printing full request/response bodies — `console\.log.*req\.body|logger\.info.*payload|log\.debug.*request`
- Risk: PII intercepted in transit or exposed in logs across multiple services; regulatory violations (GDPR, HIPAA)
- Remediation: Encrypt PII fields at the application layer; use mTLS for transport; redact sensitive fields from logs

### High

**Cross-Service Data Leakage**
- Pattern: Service API responses returning more fields than the caller needs — no field filtering or DTO projection
- Pattern: Internal service endpoints returning full database entities — `findAll|find_by|SELECT \*` results returned as-is
- Risk: Service A exposes data to Service B that Service B has no business accessing; violates least-privilege data access
- Remediation: Implement response DTOs per consumer; apply field-level access control; use GraphQL or sparse fieldsets to limit exposure

**Audit Trail Gaps Across Services**
- Pattern: Actions spanning multiple services without correlated audit logs
- Pattern: Some services log user actions, others do not — inconsistent `audit_log|auditLog|AuditEvent` usage
- Pattern: No centralized audit service or event stream for security-relevant actions
- Risk: Cannot reconstruct who did what across a distributed transaction; compliance failures; investigation gaps
- Remediation: Emit audit events from every service to a centralized, immutable audit log; include correlation ID, user ID, action, and timestamp

### Medium

**Missing Data Classification Per Service**
- Pattern: No data classification metadata — absence of labels like `data-classification: confidential|restricted|internal|public`
- Pattern: All services have equal database access regardless of data sensitivity
- Risk: Sensitive data treated the same as public data; no differentiated controls; over-exposure of classified information
- Remediation: Label services and data stores by classification; apply controls proportional to sensitivity; restrict cross-classification access

**Database Per Service with Inconsistent Access Controls**
- Pattern: Database credentials with full admin privileges — `GRANT ALL|role:.*admin|superuser:\s*true` in database user config
- Pattern: Services accessing other services' databases directly — cross-schema queries or shared connection strings
- Pattern: No database user per service — same `DB_USER|DB_PASSWORD` across multiple service configs
- Risk: Service compromise grants access to other services' data stores; no isolation between data domains
- Remediation: Create per-service database users with minimal grants; enforce schema/database isolation; never share database credentials across services

### Low

**No Data Flow Mapping**
- Pattern: No documentation of what data moves between services
- Risk: Cannot assess blast radius of a breach or ensure regulatory compliance for data residency
- Remediation: Map data flows between services; identify where PII and sensitive data traverse; enforce encryption and access controls at each hop
