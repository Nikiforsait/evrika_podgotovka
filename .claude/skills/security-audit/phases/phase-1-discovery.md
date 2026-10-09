# Phase 1 — Asset Discovery

**Goal:** Map the project's technology stack, architecture, and attack surface. Classify the platform type and determine which security check chains to activate.

## Steps

1. **Discover files by extension** — use Glob to build a file inventory:
   - `**/*.js`, `**/*.ts`, `**/*.jsx`, `**/*.tsx` → JavaScript/TypeScript
   - `**/*.py` → Python
   - `**/*.java`, `**/*.kt` → Java/Kotlin
   - `**/*.go` → Go
   - `**/*.rb` → Ruby
   - `**/*.php` → PHP
   - `**/*.rs` → Rust
   - `**/*.cs` → C#
   - `**/*.swift` → Swift

2. **Detect frameworks** by searching for signature files/imports:
   - `package.json` → Node.js (check for express, next, react, angular, vue, etc.)
   - `requirements.txt` / `Pipfile` / `pyproject.toml` → Python (django, flask, fastapi, etc.)
   - `pom.xml` / `build.gradle` → Java (spring, etc.)
   - `go.mod` → Go
   - `Gemfile` → Ruby (rails, sinatra, etc.)
   - `composer.json` → PHP (laravel, symfony, etc.)
   - `Cargo.toml` → Rust

3. **Detect infrastructure:**
   - `Dockerfile`, `docker-compose*.yml` → Docker
   - `*.tf` → Terraform
   - `*.yaml`/`*.yml` with `kind:` → Kubernetes
   - `.github/workflows/*.yml` → GitHub Actions
   - `.gitlab-ci.yml` → GitLab CI
   - `Jenkinsfile` → Jenkins
   - `serverless.yml` → Serverless Framework

4. **Detect databases** by searching for connection patterns:
   - `mongoose|mongodb|MongoClient` → MongoDB
   - `pg|postgres|psycopg|sequelize` → PostgreSQL
   - `mysql|mysql2` → MySQL
   - `redis|ioredis` → Redis
   - `sqlite|better-sqlite3` → SQLite

5. **Detect API types:**
   - `express|fastify|koa|hapi|router` → REST API
   - `graphql|apollo|type-defs|resolvers|gql` → GraphQL
   - `socket\.io|ws|WebSocket|wss://` → WebSocket
   - `grpc|proto|protobuf` → gRPC
   - `swagger|openapi|api-docs` → Has API documentation

6. **Detect platform traits** (set `is_*` flags — multiple can be true):

   **BaaS** (`is_baas`): `@supabase/supabase-js`, `SUPABASE_URL`, `firebase`, `firebase-admin`, `firestore.rules`, `appwrite`, `pocketbase`

   **Desktop** (`is_desktop`): `electron` in deps, `electron-builder`, `@tauri-apps/api`, `tauri.conf.json`

   **CMS** (`is_cms`): `wp-config.php`, `wp-content/`, `sites/default/settings.php`, `configuration.php`

   **E-commerce** (`is_ecommerce`): `stripe`, `@stripe/stripe-js`, `paypal`, `shopify`, `woocommerce`, `braintree`, `square`

   **AI/ML** (`is_ai_ml`): `openai`, `@anthropic-ai/sdk`, `langchain`, `transformers`, `torch`, `tensorflow`, `pinecone`, `weaviate`, `*.pkl`, `*.pt`

   **Browser extension** (`is_browser_extension`): `manifest.json` with `permissions` or `content_scripts`

   **Mobile** (`is_mobile`): `react-native`, `expo`, `flutter`, `pubspec.yaml`, `*.swift` + `*.xcodeproj`, `*.kt` + `AndroidManifest.xml`, `@capacitor/core`

   **Web3** (`is_web3`): `*.sol`, `hardhat.config`, `foundry.toml`, `ethers`, `web3`, `viem`, `wagmi`, `anchor`, `truffle-config.js`

   **Microservices** (`is_microservices`): `docker-compose*.yml` with 3+ services, K8s with 3+ Deployments, `consul`, `etcd`, `kafka`, `rabbitmq`, `nats`, `sqs`

   **Fullstack hybrid** (`has_api_routes`): `pages/api/`, `app/api/` (Next.js), `server/api/` (Nuxt), `src/routes/+server` (SvelteKit)

   **Serverless** (`is_serverless`): `serverless.yml`, `aws-lambda`, `@netlify/functions`, `@vercel/node`

   **Monorepo** (`is_monorepo`): `turbo.json`, `nx.json`, `pnpm-workspace.yaml`

   **Static site**: `hugo.toml`, `jekyll`, `gatsby` without API

   **CLI/library**: No web framework + `bin` field or `console_scripts`

7. **Classify primary platform type + overlay traits:**

   Primary type (first match wins):
   1. Turborepo/Nx/pnpm workspace → `monorepo` (classify each subproject)
   2. BaaS + no server framework → `baas`
   3. Next.js/Nuxt/SvelteKit/Remix with API routes → `fullstack-hybrid`
   4. Server framework (Express, Django, Rails, etc.) → `traditional-server`
   5. React/Vue/Angular without server → `spa-plus-api`
   6. Lambda/Vercel/Netlify functions → `serverless`
   7. React Native/Flutter/Expo → `mobile-app`
   8. Electron/Tauri → `desktop-app`
   9. WordPress/Drupal/Joomla → `wordpress-cms`
   10. Hugo/Jekyll/Gatsby → `static-site`
   11. CLI/library → `cli-library`
   12. manifest.json with extensions → `browser-extension`

   Overlay traits (set regardless of primary type): `is_ecommerce`, `is_ai_ml`, `is_web3`, `is_microservices`, `is_baas`

   **All `is_*` flags trigger loading the corresponding reference file.**

8. Count total source files. If >200, set `is_large_codebase = true`.

9. Populate the **STACK_PROFILE** and set `reference_files_to_load`.

10. **Display the platform classification** to the user:

```
╔══════════════════════════════════════════════════════════════╗
║  🔍 PLATFORM DETECTED                                       ║
╠══════════════════════════════════════════════════════════════╣
║  Primary:    <platform type>                                 ║
║  Languages:  <languages> (<N> files)                         ║
║  Overlays:   <overlay traits>                                ║
║  APIs:       <api types>                                     ║
║  Infra:      <infrastructure>                                ║
╠══════════════════════════════════════════════════════════════╣
║  Security check chains activated:                            ║
║  ✅ <active chains>                                          ║
║  ⬚ <inactive chains> (N/A)                                  ║
╠══════════════════════════════════════════════════════════════╣
║  Reference files loaded: N core + N platform-specific        ║
╚══════════════════════════════════════════════════════════════╝
```

11. Output the full **Stack Summary** table.
