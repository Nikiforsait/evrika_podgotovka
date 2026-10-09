# Phase 3 — Dependency & Supply Chain

**Goal:** Audit dependencies for known vulnerabilities, lockfile integrity, and supply chain risks.

**Reference:** Read `skills/security-audit/references/dependency-audit-guide.md` for detailed patterns.

## Steps

1. **Automated audit** — try the appropriate audit command:
   - Node.js: `npm audit --json 2>/dev/null` or `yarn audit --json 2>/dev/null`
   - Python: `pip-audit --format=json 2>/dev/null` or `safety check --json 2>/dev/null`
   - Ruby: `bundle audit check 2>/dev/null`
   - Go: `govulncheck ./... 2>/dev/null`
   - Rust: `cargo audit --json 2>/dev/null`
   - PHP: `composer audit --format=json 2>/dev/null`

   If not available, gracefully fall back to manual analysis.

2. **Lockfile checks**: Verify lockfile exists, not in `.gitignore`, official registry URLs, integrity hashes.

3. **Version pinning**: Analyze dependency manifests for unpinned or loosely pinned versions.

4. **Known vulnerable versions**: Check against the reference file for notorious CVEs.

5. **Supply chain**: Check for dependency confusion risks, install scripts, typosquatting indicators.
