# Phase 5 — IaC Review

**Goal:** Audit Docker, Terraform, Kubernetes, CloudFormation, and CI/CD configurations.

**References:**
- Read `skills/security-audit/references/iac-security-checks.md` for detailed patterns
- If `is_microservices = true`: read `skills/security-audit/references/microservices-checks.md`

## Steps

1. **Docker**: If `Dockerfile` or `docker-compose*.yml` exist:
   - Check for root user, secrets in build, unpinned images, privileged mode
   - Check for missing `.dockerignore`, exposed sensitive ports, missing healthcheck

2. **Terraform**: If `*.tf` files exist:
   - Check for public resources, hardcoded secrets, unencrypted storage
   - Check for overly permissive IAM, missing logging, state file security

3. **Kubernetes**: If K8s manifests exist:
   - Check for privileged containers, cluster-admin bindings, plaintext secrets
   - Check for missing security context, resource limits, network policies

4. **CI/CD**: Check pipeline configs:
   - GitHub Actions: secrets in config, unpinned actions, privileged execution
   - GitLab CI, Jenkins, etc.: similar patterns per reference

5. **Microservices** (if detected): Check service mesh config, network policies, service-to-service auth.

6. Record findings with severity, description, and remediation.
