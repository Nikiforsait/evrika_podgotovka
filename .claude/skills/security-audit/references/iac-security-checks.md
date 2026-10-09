# Infrastructure as Code (IaC) Security Checks

Reference file for Phase 5 (IaC Review). Contains security patterns for Docker, Terraform, Kubernetes, CloudFormation, and CI/CD pipelines.

---

## Docker / Containerfile

### Critical

**Running as Root**
- Pattern: Dockerfile without `USER` directive (defaults to root)
- Pattern: `USER root` without switching back to non-root
- Remediation: Add `USER nonroot` or `USER 1001` after installing packages

**Secrets in Build**
- Pattern: `ENV.*(?:PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL)\s*=`
- Pattern: `ARG.*(?:PASSWORD|SECRET|KEY|TOKEN)` (build args visible in image history)
- Pattern: `COPY.*\.env|ADD.*\.env`
- Pattern: `RUN.*echo.*(?:password|secret|key|token).*>>`
- Remediation: Use Docker secrets, multi-stage builds, or runtime env vars

### High

**Unpinned Base Images**
- Pattern: `FROM\s+\w+:latest|FROM\s+\w+\s*$` (no tag or `latest`)
- Remediation: Pin to specific digest — `FROM image@sha256:...`

**Privileged Mode / Capabilities**
- Pattern in docker-compose: `privileged:\s*true`
- Pattern in docker-compose: `cap_add:.*SYS_ADMIN|NET_ADMIN|ALL`
- Remediation: Remove privileged mode; use minimal capabilities

**Package Manager Cache**
- Pattern: `RUN apt-get install` without `--no-install-recommends` and `rm -rf /var/lib/apt/lists/*`
- Remediation: Clean package cache in same layer

### Medium

**COPY vs ADD**
- Pattern: `ADD\s+https?://` (ADD with URLs — prefer COPY + curl for auditability)
- Pattern: `ADD\s+.*\.tar` (auto-extraction can be surprising)
- Remediation: Use COPY for local files; use curl/wget + explicit extraction

**Exposed Ports**
- Pattern: `EXPOSE\s+(22|3389|5432|3306|6379|27017|11211)` — sensitive service ports
- Remediation: Only expose application ports; use internal networks for databases

**Missing HEALTHCHECK**
- Pattern: Dockerfile without `HEALTHCHECK` directive
- Remediation: Add `HEALTHCHECK CMD curl -f http://localhost/ || exit 1`

**Missing .dockerignore**
- Check: `.dockerignore` file missing or doesn't exclude `.git`, `.env`, `node_modules`
- Remediation: Create `.dockerignore` with standard exclusions

### Low

**Non-reproducible Builds**
- Pattern: `RUN apt-get upgrade|RUN apk upgrade|RUN pip install` without version pins
- Remediation: Pin all dependency versions

---

## Terraform

### Critical

**Publicly Exposed Resources**
- Pattern: `cidr_blocks\s*=\s*\["0\.0\.0\.0/0"\]` on sensitive ports
- Pattern: `ingress\s*\{[^}]*from_port\s*=\s*(22|3389|5432|3306)[^}]*cidr_blocks\s*=\s*\["0\.0\.0\.0/0"\]`
- Pattern: `publicly_accessible\s*=\s*true` (RDS, Redshift)
- Remediation: Restrict CIDR blocks to known IPs; use VPN/bastion

**Hardcoded Secrets**
- Pattern: `(password|secret_key|access_key)\s*=\s*"[^"]{8,}"`
- Pattern: Values matching AWS key pattern `AKIA[A-Z0-9]{16}`
- Remediation: Use `var` references or secret manager data sources

**Unencrypted Storage**
- Pattern: `aws_s3_bucket` without `server_side_encryption_configuration`
- Pattern: `aws_ebs_volume` without `encrypted = true`
- Pattern: `aws_rds_instance` without `storage_encrypted = true`
- Remediation: Enable encryption at rest for all storage resources

### High

**Overly Permissive IAM**
- Pattern: `"Action"\s*:\s*"\*"|"Resource"\s*:\s*"\*"` in IAM policies
- Pattern: `effect\s*=\s*"Allow".*actions\s*=\s*\["\*"\]`
- Remediation: Apply principle of least privilege

**Missing Logging**
- Pattern: `aws_s3_bucket` without `logging` block
- Pattern: `aws_cloudtrail` not defined
- Pattern: `aws_flow_log` not defined for VPCs
- Remediation: Enable logging for all resources

**State File Security**
- Pattern: `backend "local"` or no backend configured (state stored locally)
- Pattern: `backend "s3"` without `encrypt = true`
- Remediation: Use remote state with encryption and locking

### Medium

**Missing Tags**
- Pattern: Resources without `tags` block
- Remediation: Enforce tagging policy for cost tracking and ownership

**Default VPC Usage**
- Pattern: `aws_default_vpc` resource usage
- Remediation: Create and use custom VPCs

**Unrestricted Egress**
- Pattern: `egress` rules with `0.0.0.0/0` and all ports
- Remediation: Restrict egress to necessary destinations

### Low

**Provider Version Not Pinned**
- Pattern: `required_providers` without version constraint
- Pattern: `version\s*=\s*">=` (too loose)
- Remediation: Pin provider versions — `version = "~> 4.0"`

---

## Kubernetes

### Critical

**Privileged Containers**
- Pattern: `privileged:\s*true`
- Pattern: `allowPrivilegeEscalation:\s*true`
- Remediation: Set `privileged: false` and `allowPrivilegeEscalation: false`

**Cluster Admin Binding**
- Pattern: `kind:\s*ClusterRoleBinding[^]*roleRef:[^]*name:\s*cluster-admin`
- Remediation: Use namespace-scoped roles with minimal permissions

**Secrets in Plaintext**
- Pattern: `kind:\s*Secret` with `data:` containing base64-encoded values in git
- Pattern: Secret values in ConfigMaps
- Remediation: Use external secret managers (Vault, AWS Secrets Manager, etc.)

### High

**No Security Context**
- Pattern: Pod/container spec without `securityContext`
- Remediation: Set `runAsNonRoot: true`, `readOnlyRootFilesystem: true`, drop capabilities

**No Resource Limits**
- Pattern: Container spec without `resources.limits`
- Remediation: Set CPU and memory limits to prevent DoS

**No Network Policies**
- Pattern: No `NetworkPolicy` resources defined
- Remediation: Implement default-deny network policies

**HostPath Volumes**
- Pattern: `hostPath:` in volume definitions
- Remediation: Use persistent volume claims instead

### Medium

**Latest Image Tag**
- Pattern: `image:.*:latest|image:\s*\S+\s*$` (no tag)
- Remediation: Pin image versions with digest

**Missing Liveness/Readiness Probes**
- Pattern: Container spec without `livenessProbe` or `readinessProbe`
- Remediation: Add health check probes

**No Pod Disruption Budget**
- Pattern: No `PodDisruptionBudget` for critical deployments
- Remediation: Set `minAvailable` or `maxUnavailable`

### Low

**Missing Labels**
- Pattern: Resources without `labels` in metadata
- Remediation: Add standard labels (app, version, component, etc.)

---

## CloudFormation

### Critical

**Publicly Accessible Resources**
- Pattern: `PubliclyAccessible:\s*(true|'true')` (RDS)
- Pattern: `CidrIp:\s*0\.0\.0\.0/0` on SSH/RDP ports
- Remediation: Restrict access

**Unencrypted Resources**
- Pattern: `StorageEncrypted:\s*(false|'false')` (RDS)
- Pattern: S3 buckets without `BucketEncryption`
- Remediation: Enable encryption

### High

**Overly Permissive Security Groups**
- Pattern: `IpProtocol:\s*-1` with `CidrIp:\s*0\.0\.0\.0/0` (all traffic from anywhere)
- Remediation: Restrict protocols and CIDR blocks

**IAM Wildcard Permissions**
- Pattern: `Action:\s*'\*'|Resource:\s*'\*'`
- Remediation: Apply least privilege

---

## CI/CD Pipelines

### Critical

**Secrets in Pipeline Config**
- Pattern (GitHub Actions): Hardcoded secrets instead of `${{ secrets.* }}`
- Pattern (GitLab CI): Variables with secret values in `.gitlab-ci.yml`
- Pattern (Jenkins): Hardcoded credentials in `Jenkinsfile`
- Remediation: Use CI platform secret management

**Unpinned Action Versions**
- Pattern (GitHub Actions): `uses: .*@master|uses: .*@main|uses: .*@v\d+$` (mutable tags)
- Remediation: Pin to SHA — `uses: action@sha256:...`

### High

**Privileged Pipeline Execution**
- Pattern (GitHub Actions): `runs-on: self-hosted` without security controls
- Pattern (Docker): `--privileged` in CI scripts
- Remediation: Use ephemeral runners; avoid privileged mode

**Pull Request from Fork — Secret Access**
- Pattern (GitHub Actions): `pull_request_target` with `actions/checkout@...` of PR head
- Remediation: Never check out untrusted code with secret access

### Medium

**Missing Branch Protection**
- Check: CI runs without required status checks
- Check: Direct push to main/master allowed
- Remediation: Require PR reviews and status checks

**Artifact Integrity**
- Pattern: Downloaded artifacts without checksum verification
- Pattern: `curl.*| sh|wget.*| sh` — piped install scripts
- Remediation: Verify checksums; audit install scripts before piping
