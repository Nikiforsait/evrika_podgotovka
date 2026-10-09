# AI/ML Application Security Checks

Reference file for AI/ML applications — LLM integrations (OpenAI, Anthropic, Cohere, etc.), machine learning model pipelines, data engineering, and vector databases. Aligned with the OWASP Top 10 for LLM Applications and general ML security best practices.

---

## LLM / AI Application Security

### Critical

**Prompt Injection — Direct**
- Pattern (Python): `(prompt|messages)\s*=.*\+\s*(user_input|request\.(json|form|args|data)|input\()|f["'].*\{(user|query|input|message|text)`
- Pattern (JS/TS): `(prompt|messages).*\+\s*(req\.body|req\.query|userInput|input)|`\$\{(user|query|input|message)\}`
- Pattern (General): String concatenation or f-string interpolation of user input directly into LLM prompt strings
- Risk: Attacker overrides system instructions, exfiltrates data, triggers unintended tool calls, or bypasses safety controls
- Remediation: Separate system/user message roles; never concatenate raw user input into system prompts; use parameterized prompt templates with input slotted into the user role only

**Prompt Injection — Indirect (via RAG / External Content)**
- Pattern: User-controlled or externally-fetched content (web scrape, document upload, email body) inserted into prompt without sanitization
- Pattern (Python): `(context|documents|chunks).*=.*retrieve|search|fetch.*\n.*prompt.*\{(context|documents|chunks)\}`
- Risk: Poisoned documents in vector DB or external sources inject instructions into the LLM context
- Remediation: Treat all retrieved content as untrusted; place retrieved content in clearly delimited blocks; apply output validation regardless of source; implement content scanning on ingested documents

**LLM Output Used in Injection-Sensitive Sinks**
- Pattern (SQL): `cursor\.execute\(.*llm_response|completion|generated|output`
- Pattern (Shell): `subprocess\.(run|call|Popen)\(.*llm_response|completion|generated|os\.system\(.*completion`
- Pattern (HTML): `innerHTML\s*=.*completion|response|generated|\{\{.*completion.*\}\}` without escaping
- Pattern (JS): `eval\(.*completion|response|generated`
- Risk: LLM output is attacker-influenced text; using it in SQL, shell, eval, or HTML creates second-order injection (prompt injection → SQLi/RCE/XSS)
- Remediation: Never pass LLM output directly to SQL, shell, or eval; always parameterize queries; sanitize/escape output before rendering in HTML; treat LLM output as untrusted user input

**Insecure Model Deserialization — Pickle / Torch / Joblib**
- Pattern (Python): `pickle\.load\(|pickle\.loads\(|torch\.load\(|joblib\.load\(|dill\.load\(|shelve\.open\(`
- Pattern (Python): `pd\.read_pickle\(|numpy\.load\(.*allow_pickle\s*=\s*True`
- Risk: Pickle deserialization allows arbitrary code execution — an attacker who controls the model file achieves full RCE on the server
- Remediation: Use `torch.load(..., weights_only=True)` for PyTorch; prefer safetensors format; use ONNX or PMML for interop; verify file integrity with checksums before loading; never load models from untrusted sources

**Excessive Agency — Auto-Executing LLM-Generated Code**
- Pattern (Python): `exec\(.*completion|response|generated|output|eval\(.*completion`
- Pattern (Python): `subprocess\.run\(.*generated|completion|agent.*\.run\(`
- Pattern (JS): `eval\(.*completion|response|new Function\(.*completion`
- Pattern: LLM tool/function calling without human-in-the-loop confirmation for destructive actions
- Risk: LLM generates malicious or erroneous code that is blindly executed, leading to data loss, RCE, or privilege escalation
- Remediation: Never auto-execute LLM output; require human approval for destructive actions; sandbox code execution (containers, gVisor); implement tool-call allowlists with parameter validation; limit blast radius with least-privilege execution contexts

**Sensitive Data Sent to Third-Party LLM APIs**
- Pattern (Python): `openai\.(ChatCompletion|chat\.completions)\.create\(.*\b(ssn|password|credit_card|secret|token|api_key|private_key)\b`
- Pattern (General): PII fields (email, phone, SSN, address) or credentials included in prompt messages sent to external APIs
- Pattern: `messages.*\[.*\{.*content.*\b(patient|diagnosis|account_number|salary)\b`
- Risk: Confidential data sent to third-party LLM providers violates privacy regulations (GDPR, HIPAA) and creates data leakage risk
- Remediation: Strip PII before sending to LLM APIs; use data masking/tokenization; prefer self-hosted models for sensitive workloads; audit all prompt content; implement PII detection in the prompt pipeline

### High

**LLM API Key Exposure**
- Pattern: `(sk-[a-zA-Z0-9]{20,}|sk-proj-[a-zA-Z0-9\-]{40,})` (OpenAI)
- Pattern: `(sk-ant-api03-[a-zA-Z0-9\-]{90,})` (Anthropic)
- Pattern: `(hf_[a-zA-Z0-9]{30,})` (HuggingFace)
- Pattern: `(key-[a-zA-Z0-9]{20,})` (Cohere)
- Pattern: `(gsk_[a-zA-Z0-9]{20,})` (Groq)
- Pattern (General): `(OPENAI_API_KEY|ANTHROPIC_API_KEY|HUGGINGFACE_TOKEN|COHERE_API_KEY)\s*=\s*["'][^"']+["']`
- Risk: Exposed API keys allow unauthorized usage, cost explosion, and data exfiltration through the compromised account
- Remediation: Use environment variables or secret managers (Vault, AWS Secrets Manager); add key patterns to `.gitignore` and pre-commit hooks; rotate keys immediately if exposed; enable usage alerts and spending limits on provider dashboards

**Missing Rate Limiting on LLM API Calls**
- Pattern: LLM API calls inside request handlers without rate limiting or cost controls
- Pattern (Python): `@app\.route.*\n.*openai\.|anthropic\.|cohere\.` without rate limiter middleware
- Pattern: No `max_tokens` parameter set on completion calls
- Pattern: `max_tokens.*=.*(16000|32000|64000|128000|100000)` (excessively high token limits)
- Risk: Attackers or runaway loops cause cost explosion; a single user can rack up thousands of dollars in API charges
- Remediation: Implement per-user and global rate limits; set reasonable `max_tokens`; configure billing alerts and hard spending caps; add circuit breakers for API call failures

**System Prompt Leakage**
- Pattern: System prompt stored in client-side code or API responses
- Pattern (JS): `system.*prompt|systemMessage|SYSTEM_PROMPT` in frontend bundles or public API responses
- Pattern: No defense against "repeat your instructions" or "ignore previous instructions" attacks
- Risk: Proprietary system prompts containing business logic, guardrails, or internal instructions are extracted by users
- Remediation: Never expose system prompts in client-side code; implement prompt extraction detection; test with known extraction prompts; store system prompts server-side only; add monitoring for prompt leakage attempts

**Missing Content Filtering / Safety Guardrails**
- Pattern: LLM output rendered to users without safety classification or content filtering
- Pattern: No moderation API call (`openai.moderations.create`, content safety classifiers) in the pipeline
- Pattern: No output validation between LLM response and user-facing display
- Risk: LLM generates harmful, biased, or inappropriate content that reaches end users, causing reputational and legal harm
- Remediation: Use moderation APIs (OpenAI Moderation, Azure Content Safety); implement output classifiers; add blocklists for known harmful patterns; log and review flagged outputs; implement fallback responses for filtered content

**Model Output Not Validated Before Use**
- Pattern: LLM JSON output parsed without schema validation — `json\.loads\(completion` without subsequent validation
- Pattern: LLM output used in application logic (decisions, routing, data updates) without verification
- Pattern (Python): `response\.choices\[0\]\.message\.content` used directly without parsing/validation
- Risk: Malformed, hallucinated, or manipulated LLM output causes application errors, data corruption, or security bypass
- Remediation: Validate all LLM output against strict schemas (JSON Schema, Pydantic, Zod); implement retry logic for malformed responses; never trust LLM output for security-critical decisions; add type checking and bounds checking

### Medium

**RAG Injection — Poisoned Documents in Vector DB**
- Pattern: Document ingestion pipeline without content scanning or provenance tracking
- Pattern: User-uploaded documents indexed directly into vector store without sanitization
- Pattern (Python): `vector_store\.(add|upsert|insert)\(.*user_upload|request\.files`
- Risk: Attacker uploads documents containing prompt injection payloads that get retrieved during RAG queries, hijacking LLM behavior for all users
- Remediation: Scan ingested documents for injection patterns; track document provenance; implement access controls on vector DB namespaces; separate user-uploaded content from trusted knowledge base; apply content integrity checks

**Embedding API Misuse — Sensitive Data in Embeddings**
- Pattern (Python): `openai\.embeddings\.create\(.*\b(password|ssn|secret|private_key|credit_card)\b`
- Pattern: PII or credentials sent to external embedding services for vectorization
- Pattern: Embedding vectors stored without access controls, allowing reconstruction attacks
- Risk: Sensitive data sent to third-party embedding APIs; embedding vectors can partially leak source content through inversion attacks
- Remediation: Strip sensitive fields before embedding; use self-hosted embedding models for sensitive data; apply access controls on vector stores; audit embedding input content

**Training Data Poisoning Vectors**
- Pattern: Training data sourced from user-generated content without review
- Pattern: Fine-tuning datasets stored in publicly accessible locations (public S3, open GCS buckets)
- Pattern: No integrity checks (checksums, signatures) on training data files
- Pattern (Python): `datasets\.load_dataset\(.*"csv"|"json".*\)` from user-accessible paths
- Risk: Attacker poisons training data to introduce backdoors, bias, or specific misclassifications into the model
- Remediation: Validate and audit all training data; implement data provenance tracking; use signed datasets; restrict write access to training data storage; monitor for anomalous data additions

**Missing Model Versioning / Provenance**
- Pattern: Model files stored without version tags, checksums, or audit trail
- Pattern: No model registry usage (MLflow, Weights & Biases, DVC)
- Pattern: Model files loaded by path without integrity verification
- Pattern (Python): `torch\.load\(["']\.\/model|joblib\.load\(["']\.\/` (loading from relative path without checksum)
- Risk: Tampered models deployed without detection; no ability to audit which model version produced a given output; supply chain attacks on model artifacts
- Remediation: Use a model registry with version tracking; sign model artifacts; verify checksums before loading; maintain audit logs of model deployments; implement model lineage tracking

**Jupyter Notebook with Credentials**
- Pattern: `.ipynb` files containing `(api_key|password|secret|token|credentials)\s*=\s*["'][^"']+["']`
- Pattern: Notebook output cells containing API keys, tokens, or connection strings
- Pattern: `!pip install` with `--index-url` pointing to private registries with embedded credentials
- Risk: Notebooks committed to version control frequently contain hardcoded secrets in code cells or output cells; notebook output can expose API responses with sensitive data
- Remediation: Use `nbstripout` to remove output cells before committing; use environment variables for all credentials; add `.ipynb` output stripping to pre-commit hooks; audit notebook output cells for leaked secrets

### Low

**Missing LLM Interaction Logging**
- Pattern: LLM API calls without logging prompt content, token usage, or response metadata
- Pattern: No audit trail for AI-generated decisions or recommendations
- Risk: Cannot detect abuse, debug issues, or demonstrate compliance; no visibility into prompt injection attempts
- Remediation: Log all LLM interactions (with PII redaction); track token usage per user; implement anomaly detection on usage patterns; maintain audit trail for AI-assisted decisions

**No Fallback for LLM API Failures**
- Pattern: LLM API calls without try/catch or fallback logic
- Pattern (Python): `openai\.chat\.completions\.create\(` without exception handling
- Pattern (JS): `await openai.chat.completions.create(` without `.catch` or try/catch
- Risk: LLM API outages cause application crashes; no graceful degradation
- Remediation: Implement retry with exponential backoff; add fallback responses; use circuit breakers; handle rate limit (429) and server error (500) responses specifically

---

## ML Model Security

### Critical

**Unsafe Model File Loading**
- Pattern (Python): `pickle\.load\(open\(|torch\.load\(["']|joblib\.load\(["']|dill\.loads?\(`
- Pattern (Python): `tensorflow\.keras\.models\.load_model\(` from untrusted source
- Pattern (Python): `onnx\.load\(` without `onnx.checker.check_model()` afterward
- File extensions to flag: `.pkl`, `.pickle`, `.pt`, `.pth`, `.joblib`, `.npy` (with `allow_pickle`)
- Risk: All pickle-based formats allow arbitrary code execution during deserialization; a malicious model file is equivalent to a backdoor
- Remediation: Use `safetensors` format; use `torch.load(..., weights_only=True)`; validate ONNX models with checker; verify file hashes against known-good values; isolate model loading in sandboxed environments

**Model Serving Without Authentication**
- Pattern: TensorFlow Serving, Triton Inference Server, or custom model APIs exposed without auth
- Pattern: `tensorflow_model_server.*--rest_api_port` without TLS or auth proxy
- Pattern: `tritonserver.*--http-port` without `--http-header-forward-pattern` or auth sidecar
- Pattern (Python/Flask): `@app\.route.*/predict` without auth decorator
- Risk: Unauthenticated model endpoints allow data exfiltration, model stealing, and resource abuse
- Remediation: Place model serving behind an API gateway with authentication; use mTLS for service-to-service calls; implement API key or JWT validation; restrict network access to model endpoints

### High

**Adversarial Input — No Validation Before Inference**
- Pattern: Model inference endpoints accepting raw input without validation or preprocessing bounds checks
- Pattern (Python): `model\.predict\(request\.json|model\(torch\.tensor\(request\.data`
- Pattern: No input shape, type, or range validation before passing to model
- Risk: Adversarial inputs cause misclassification, model extraction, or denial of service through crafted tensors
- Remediation: Validate input shape, type, and value ranges; implement input preprocessing with bounds checking; add anomaly detection on inference inputs; rate limit inference endpoints

**Training Data with PII Accessible**
- Pattern: Training datasets stored in publicly accessible storage without encryption
- Pattern: `s3://.*training|gs://.*dataset|/data/training` without access control review
- Pattern: CSV/Parquet files with columns named `email|phone|ssn|name|address` in data directories
- Risk: Training data containing PII exposed through misconfigured storage, violating GDPR/CCPA
- Remediation: Encrypt training data at rest; apply least-privilege access controls; anonymize PII in training sets; use data governance tools to track PII in datasets; implement data retention policies

**Hardcoded API Keys Instead of Environment Variables**
- Pattern (Python): `openai\.api_key\s*=\s*["']sk-[^"']+["']|api_key\s*=\s*["']sk-[^"']+["']`
- Pattern (Python): `anthropic\.Anthropic\(api_key\s*=\s*["']sk-ant[^"']+["']\)`
- Pattern (JS): `new OpenAI\(\{\s*apiKey:\s*["']sk-[^"']+["']\s*\}\)`
- Pattern: Any AI service client initialized with a string literal key instead of `os.environ` or `process.env`
- Risk: Credentials committed to version control, exposed in logs, or leaked in error messages
- Remediation: Use `os.environ["OPENAI_API_KEY"]` or `process.env.OPENAI_API_KEY`; configure `.env` files excluded from version control; use secret managers in production

### Medium

**Model API Without Request Logging**
- Pattern: Inference endpoints without logging input characteristics, prediction output, or latency
- Risk: Cannot detect model drift, adversarial attacks, or data exfiltration attempts
- Remediation: Log inference metadata (input shape, output class, confidence, latency); implement monitoring dashboards; alert on anomalous prediction distributions

**Insecure Model Download**
- Pattern (Python): `urllib\.request\.urlretrieve\(.*\.pkl|requests\.get\(.*model.*\.pt`
- Pattern (Python): `from_pretrained\(` loading from untrusted or unverified repositories
- Pattern: Model downloaded over HTTP (not HTTPS) without checksum verification
- Risk: Man-in-the-middle attacks can substitute malicious model files during download
- Remediation: Always use HTTPS; verify checksums/signatures after download; pin model revisions by hash; use trusted model registries with integrity verification

### Low

**Missing Model Cards / Documentation**
- Pattern: Model files deployed without accompanying model card or documentation
- Risk: No visibility into model limitations, biases, intended use, or training data provenance
- Remediation: Maintain model cards for all deployed models; document intended use, limitations, bias evaluations, and training data sources

---

## Data Pipeline Security

### Critical

**Airflow DAGs with Hardcoded Credentials**
- Pattern (Python): `(password|secret|api_key|token|conn_string)\s*=\s*["'][^"']+["']` in `*_dag.py` or `dags/` directory
- Pattern (Python): `Connection\(.*password\s*=\s*["']|Variable\.set\(["'](password|secret)`
- Pattern: Airflow connections configured with plaintext passwords in DAG code instead of Airflow Connections UI or Secrets Backend
- Risk: Credentials in DAG source code are exposed to anyone with repository access and appear in Airflow logs
- Remediation: Use Airflow Connections and Secrets Backend (Vault, AWS SSM); never hardcode credentials in DAG files; use `{{ conn.my_conn.password }}` templating with encrypted backend

**PII in Data Pipelines Without Masking**
- Pattern: ETL/ELT jobs processing columns with PII (name, email, SSN, phone) without masking or encryption
- Pattern (SQL): `SELECT\s+\*\s+FROM` in transformation steps (selecting all columns including PII)
- Pattern (Python/Spark): `df\[["']?(email|ssn|phone|name|address)["']?\]` passed to downstream systems without masking
- Risk: PII propagated through pipeline stages without protection violates privacy regulations and increases breach impact
- Remediation: Implement column-level masking/encryption; use allowlists for required columns instead of `SELECT *`; apply anonymization at ingestion; tag PII columns in data catalog

### High

**dbt Models with SQL Injection Risk**
- Pattern (SQL/Jinja): `\{\{\s*var\(.*\)\s*\}\}` used directly in SQL without quoting/escaping in dbt models
- Pattern: `{{ env_var() }}` interpolated into SQL WHERE clauses
- Risk: User-controlled variables injected into SQL templates
- Remediation: Use dbt's built-in quoting and adapter macros; parameterize queries; validate variable inputs; avoid interpolating external input directly into SQL

**Spark Jobs with Insecure Data Access**
- Pattern (Python): `spark\.read\.(csv|parquet|json)\(["']s3a?://` with embedded credentials in URI
- Pattern: `spark.hadoop.fs.s3a.access.key` or `spark.hadoop.fs.s3a.secret.key` hardcoded in Spark config
- Pattern: Spark jobs running with overly broad IAM roles (full S3 or GCS access)
- Risk: Overprivileged Spark jobs can access or modify data beyond their scope; credential exposure in Spark configurations
- Remediation: Use IAM roles for service accounts; apply least-privilege data access; configure credentials via secret injection not config files; restrict S3/GCS bucket policies per job

**ETL Jobs with Overly Broad Permissions**
- Pattern: ETL service accounts with `s3:*`, `bigquery.admin`, or `SUPERUSER` database roles
- Pattern: Single shared service account used across all pipeline jobs
- Risk: Compromised ETL job gains access to all data; lateral movement across data stores
- Remediation: Create per-job service accounts with minimal permissions; use separate read/write roles; implement break-glass procedures for elevated access; audit service account permissions quarterly

### Medium

**Data Lake Access Controls**
- Pattern (AWS): S3 bucket policies with `"Principal": "*"` or `"Effect": "Allow"` without conditions for data buckets
- Pattern (GCP): BigQuery datasets with `allAuthenticatedUsers` or `allUsers` access
- Pattern (Snowflake): `GRANT.*TO ROLE PUBLIC` on sensitive schemas
- Risk: Overly permissive access allows unauthorized data access or exfiltration
- Remediation: Apply least-privilege access; use column-level security for sensitive data; enable audit logging on all data stores; review access grants regularly; implement data classification and tiered access

**Missing Data Lineage / Audit Trail**
- Pattern: Data transformations without metadata tracking or lineage capture
- Pattern: No data catalog (DataHub, Amundsen, OpenMetadata) integration
- Risk: Cannot trace data provenance for compliance; unable to determine impact of data quality issues; no audit trail for regulatory requirements
- Remediation: Implement data lineage tracking; integrate with data catalog; log all data transformations with source/target metadata; enable query audit logs on warehouses

### Low

**Missing Data Quality Checks**
- Pattern: Pipeline stages without data validation (row counts, null checks, schema validation)
- Pattern (Python): No `great_expectations`, `dbt tests`, `pandera`, or equivalent validation in pipeline
- Risk: Corrupted or anomalous data propagates through the pipeline undetected
- Remediation: Add data quality checks at pipeline boundaries; use Great Expectations or dbt tests; implement anomaly detection on key metrics; alert on schema drift

---

## Vector Database Security

### Critical

**Vector DB API Keys Exposed**
- Pattern: `(PINECONE_API_KEY|WEAVIATE_API_KEY|QDRANT_API_KEY|MILVUS_TOKEN|CHROMA_SERVER_AUTH)\s*=\s*["'][^"']+["']`
- Pattern (Python): `pinecone\.init\(api_key\s*=\s*["'][^"']+["']\)|weaviate\.Client\(.*api_key\s*=\s*["']`
- Pattern (JS): `new PineconeClient\(\{.*apiKey:\s*["'][^"']+["']\s*\}\)|new QdrantClient\(\{.*apiKey:\s*["']`
- Risk: Exposed vector DB keys allow full read/write access to embeddings and metadata, enabling data exfiltration and RAG poisoning
- Remediation: Use environment variables or secret managers; rotate keys if exposed; restrict API key permissions where supported; monitor API key usage

**Vector DB Accessible Without Authentication**
- Pattern: Qdrant, Chroma, or Milvus running without authentication enabled
- Pattern: `qdrant-server` started without `--api-key` flag
- Pattern: `chromadb.HttpClient(host=` without authentication settings
- Pattern: Vector DB ports (6333, 8000, 19530) exposed to public network
- Risk: Unauthenticated access allows reading, modifying, or deleting all vectors and metadata — complete RAG data exfiltration and poisoning
- Remediation: Enable authentication on all vector databases; use network policies to restrict access; place behind API gateway; enable TLS for in-transit encryption

### High

**PII in Vector DB Metadata**
- Pattern: Embedding upsert calls with metadata containing PII fields
- Pattern (Python): `\.upsert\(.*metadata.*\b(email|phone|ssn|name|address|patient|salary)\b`
- Pattern: Full document text stored in metadata alongside embeddings
- Risk: Vector DB metadata fields often bypass access controls and encryption; PII in metadata is searchable and extractable
- Remediation: Strip PII from metadata before storing; store only document IDs in metadata and look up content from access-controlled source; encrypt sensitive metadata fields; apply namespace-level access controls

**Missing Access Control on Namespaces / Collections**
- Pattern: All users/services share a single vector DB namespace or collection
- Pattern: No tenant isolation — multi-tenant application uses single collection without filtering
- Pattern (Python): `index\.query\(` without namespace or metadata filter for tenant isolation
- Risk: Cross-tenant data leakage; users can retrieve other tenants' embeddings and documents through similarity search
- Remediation: Use separate namespaces or collections per tenant; implement metadata-based filtering with mandatory tenant ID; enforce access controls at the application layer; audit cross-namespace queries

### Medium

**Vector DB Backup Security**
- Pattern: Vector DB snapshots or backups stored without encryption
- Pattern: Backup locations accessible with broader permissions than the source database
- Risk: Backups contain full copy of all embeddings and metadata, creating additional attack surface
- Remediation: Encrypt backups at rest; apply same access controls as production database; implement backup retention policies; test backup restore procedures

### Low

**Missing Vector DB Monitoring**
- Pattern: No logging or monitoring configured for vector DB operations
- Risk: Cannot detect unauthorized access, data exfiltration attempts, or anomalous query patterns
- Remediation: Enable operation logging; monitor query patterns and volume; alert on unusual access patterns; track storage growth and index operations

---

## Quick Reference — Detection Commands

```bash
# Prompt injection — user input in prompts (Python)
grep -rnP '(f["\'].*\{(user|input|query|message).*\}|prompt\s*\+\s*(user|request|input))' --include="*.py" .

# Unsafe model loading (Python)
grep -rnP '(pickle\.loads?\(|torch\.load\(|joblib\.load\(|dill\.loads?\()' --include="*.py" .

# LLM output in dangerous sinks (Python)
grep -rnP '(exec\(|eval\(|subprocess\.\w+\(|cursor\.execute\().*?(completion|response|generated|output)' --include="*.py" .

# AI API keys hardcoded (all files)
grep -rnP '(sk-[a-zA-Z0-9]{20,}|sk-ant-api03-[a-zA-Z0-9\-]{90,}|hf_[a-zA-Z0-9]{30,})' .

# Vector DB keys exposed
grep -rnP '(PINECONE_API_KEY|WEAVIATE_API_KEY|QDRANT_API_KEY)\s*=\s*["\x27][^\x27"]+["\x27]' .

# PII in LLM prompts or embedding calls
grep -rnP '(messages|embed|prompt).*\b(ssn|password|credit_card|secret|private_key)\b' --include="*.py" .

# Jupyter notebooks with secrets
grep -rnP '(api_key|password|secret|token)\s*=\s*["\x27][^"\x27]+["\x27]' --include="*.ipynb" .

# Insecure pickle in data pipelines
grep -rnP 'allow_pickle\s*=\s*True|pd\.read_pickle\(' --include="*.py" .

# Airflow DAGs with hardcoded creds
grep -rnP '(password|secret|api_key)\s*=\s*["\x27][^"\x27]+["\x27]' dags/ --include="*.py"
```
