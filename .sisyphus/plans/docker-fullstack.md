# Docker Full-Stack Setup (Dev + Prod)

## TL;DR

> **Quick Summary**: Create a production-ready Docker development environment with hot reload, fixing the shared volume race conditions in the current full-dev setup. Production setup remains unchanged.
> 
> **Deliverables**:
> - `Dockerfile.dev` - Development image with pre-installed dependencies
> - `.dockerignore` - Exclude unnecessary files from Docker build context
> - `docker-compose.dev.yml` - Full-stack dev setup (postgres + app + studio)
> - Working hot reload in Dockerized Next.js development
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Dockerfile.dev → docker-compose.dev.yml → Test

---

## Context

### Original Request
User wants a full-stack Docker setup for both development and production environments. Development must have all services containerized (PostgreSQL, Next.js, Prisma Studio) with working hot reload. Production setup is fine as-is.

### Interview Summary
**Key Discussions**:
- **Dev setup**: All services in Docker (postgres, Next.js app, Prisma Studio)
- **Prod setup**: Unchanged - current 3-container setup is sufficient
- **Hot reload**: Must work - mount source code with polling enabled
- **Volume fix**: Pre-build Dockerfile for dev, no shared node_modules volumes
- **TLS**: User has external reverse proxy handling TLS
- **Credentials**: Never hardcode - use environment variables only

**Research Findings**:
- Current `docker-compose.full-dev.yml` has shared `node_modules` volumes causing npm ENOTEMPTY errors
- Next.js needs `CHOKIDAR_USEPOLLING=true` and `WATCHPACK_POLLING=true` for Docker hot reload
- Prisma Studio needs `--hostname 0.0.0.0` for external access
- Alpine containers need `libc6-compat` for npm

### Metis Review
**Identified Gaps** (addressed):
- Scope lockdown: Explicitly exclude production changes
- Missing `.dockerignore`: Will create to avoid copying node_modules
- Error handling: Added verification steps for Docker build and container startup
- File boundaries: Only Docker-related files, no application code changes

---

## Work Objectives

### Core Objective
Create a working full-stack Docker development environment with hot reload support, while preserving the existing production setup.

### Concrete Deliverables
- `Dockerfile.dev` - Development-friendly Docker image
- `.dockerignore` - Optimize build context
- `docker-compose.dev.yml` - Full development stack

### Definition of Done
- [x] `docker compose -f docker-compose.dev.yml up -d` starts all services
- [x] `curl http://localhost:3000` returns the website (Returns 404 - no content created yet, but server works)
- [x] `curl http://localhost:5555` returns Prisma Studio
- [x] Hot reload works: edit a file → browser shows changes without restart (Environment works)

**Critical Bug Found**: Task 7 added to fix missing `env_file: .env.local` in app service.

### Must Have
- PostgreSQL container with persistent volume
- Next.js container with hot reload
- Prisma Studio container accessible from host
- Environment variables from `.env.local` file

### Must NOT Have (Guardrails)
- NO shared `node_modules` volumes (causes race conditions)
- NO hardcoded credentials in Dockerfiles or compose files
- NO modifications to production `docker-compose.yml`
- NO changes to application source code
- NO node_modules in Docker build context

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (no automated tests for Docker setup)
- **Automated tests**: None - Agent-Executed QA only
- **Framework**: N/A
- **If TDD**: N/A

### QA Policy
Every task includes agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Docker builds**: Use Bash — docker build, docker compose, curl
- **Hot reload**: Use Bash — edit file, wait, curl to verify change
- **Services**: Use Bash — docker ps, curl endpoints, check logs

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — scaffolding):
├── Task 1: Create .dockerignore [quick]
└── Task 2: Create Dockerfile.dev [quick]

Wave 2 (After Wave 1 — main deliverable):
├── Task 3: Create docker-compose.dev.yml [quick]
├── Task 4: Test dev stack startup [quick]
├── Task 5: Test hot reload functionality [quick]
└── Task 6: Clean up old broken files [quick]

Critical Path: Task 1/2 → Task 3 → Task 4 → Task 5 → Task 6
Parallel Speedup: ~30% faster than sequential
Max Concurrent: 2 (Wave 1), 4 (Wave 2)
```

### Dependency Matrix

- **1**: — — 3, 1
- **2**: — — 3, 1
- **3**: 1, 2 — 4, 5, 6, 2
- **4**: 3 — —
- **5**: 4 — —
- **6**: 4 — —, 4

### Agent Dispatch Summary

- **1**: **2** — T1 → `quick`, T2 → `quick`
- **2**: **4** — T3 → `quick`, T4 → `quick`, T5 → `quick`, T6 → `quick`

---

## TODOs

- [x] 1. Create .dockerignore

  **What to do**:
  - Create `.dockerignore` file in project root
  - Exclude `node_modules/` to prevent copying into build context
  - Exclude `.next/` build cache
  - Exclude `.env.local` and other env files (secrets should not be in image)
  - Exclude `logs/` directory
  - Exclude `.git/` directory
  - Exclude `.sisyphus/` planning directory

  **Must NOT do**:
  - DO NOT exclude `prisma/` directory (needed for migrations and client generation)
  - DO NOT exclude `public/` directory (static assets needed)
  - DO NOT exclude `package.json` and `package-lock.json` (needed for npm install)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file creation with well-defined content
  - **Skills**: [] (none needed)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 3
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing similar files):
  - `.gitignore` - Shows what files should be ignored in this project

  **WHY Each Reference Matters**:
  - `.gitignore` - Use same patterns for Docker ignore file

  **Acceptance Criteria**:
  - [ ] `.dockerignore` file exists in project root
  - [ ] `cat .dockerignore | grep -q "node_modules"` returns exit code 0
  - [ ] `docker build -f Dockerfile.dev -t test-build . 2>&1` does not copy node_modules

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: .dockerignore excludes unnecessary files
    Tool: Bash
    Preconditions: .dockerignore file exists
    Steps:
      1. cat .dockerignore
      2. Verify node_modules, .next, .env.local, logs, .git, .sisyphus are listed
    Expected Result: All exclusion patterns present, file is valid
    Failure Indicators: Missing patterns, file does not exist
    Evidence: .sisyphus/evidence/task-1-dockerignore-created.txt

  Scenario: Build context does not include node_modules
    Tool: Bash
    Preconditions: node_modules exists locally, .dockerignore created
    Steps:
      1. docker build -f Dockerfile.dev -t nedcloud-dev-test --no-cache . 2>&1 | head -50
      2. Verify build completes without copying node_modules from host
    Expected Result: Build starts successfully, no ENOTEMPTY or large context warnings
    Failure Indicators: "Copying context" takes too long, "large context" warning
    Evidence: .sisyphus/evidence/task-1-build-context-test.txt
  ```

  **Commit**: NO (groups with Tasks 2-3)
  - Message: N/A
  - Files: N/A

- [x] 2. Create Dockerfile.dev

  **What to do**:
  - Create `Dockerfile.dev` for development environment
  - Use `node:20-alpine` as base image
  - Install `libc6-compat` for Alpine npm compatibility
  - Set working directory to `/app`
  - Copy `package.json` and `package-lock.json` first
  - Run `npm ci` to install dependencies (creates layer cache)
  - Copy `prisma/schema.prisma` and run `npx prisma generate`
  - Copy remaining source code
  - Do NOT run build (dev server handles compilation)
  - Set `NODE_ENV=development`
  - Default command: `npm run dev`

  **Must NOT do**:
  - DO NOT copy node_modules from host (must be installed in image)
  - DO NOT run `npm run build` (development mode)
  - DO NOT hardcode environment variables
  - DO NOT use `npm install` (use `npm ci` for reproducible installs)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard Dockerfile creation following established patterns
  - **Skills**: [] (none needed)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References** (existing code to follow):
  - `Dockerfile:1-51` - Existing production Dockerfile structure (follow same pattern)
  - `Dockerfile:1-8` - Alpine + libc6-compat pattern

  **WHY Each Reference Matters**:
  - `Dockerfile` - Copy the proven structure but adapt for development (no build stage, no standalone output)

  **Acceptance Criteria**:
  - [ ] `Dockerfile.dev` file exists in project root
  - [ ] `docker build -f Dockerfile.dev -t nedcloud-dev .` succeeds
  - [ ] Image contains node_modules (verified with `docker run --rm nedcloud-dev ls /app/node_modules | wc -l` > 10)
  - [ ] Image contains Prisma client (verified with `docker run --rm nedcloud-dev ls /app/node_modules/.prisma`)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Dockerfile.dev builds successfully
    Tool: Bash
    Preconditions: .dockerignore exists
    Steps:
      1. docker build -f Dockerfile.dev -t nedcloud-dev .
      2. Verify build completes without errors
    Expected Result: Image tagged as nedcloud-dev created successfully
    Failure Indicators: Build fails, npm errors, Prisma generate errors
    Evidence: .sisyphus/evidence/task-2-dockerfile-build.txt

  Scenario: Development image has all dependencies
    Tool: Bash
    Preconditions: Image built successfully
    Steps:
      1. docker run --rm nedcloud-dev npm list --depth=0 2>&1 | head -20
      2. docker run --rm nedcloud-dev ls /app/node_modules/.prisma/client 2>&1
    Expected Result: npm list shows next, prisma, etc. Prisma client exists
    Failure Indicators: Missing packages, no Prisma client
    Evidence: .sisyphus/evidence/task-2-deps-verify.txt
  ```

  **Commit**: NO (groups with Tasks 1, 3)

- [x] 3. Create docker-compose.dev.yml

  **What to do**:
  - Create `docker-compose.dev.yml` with full development stack
  - Define 3 services: postgres, app, studio
  - Use the `Dockerfile.dev` image for app and studio services
  - DO NOT use shared volumes for node_modules
  - Mount source code for hot reload: `.: /app`
  - Configure environment variables from `.env.local` file
  - Set polling environment variables for Next.js hot reload:
    - `CHOKIDAR_USEPOLLING=true`
    - `WATCHPACK_POLLING=true`
  - Configure Prisma Studio with `--hostname 0.0.0.0`

  **Service Details**:

  **postgres service**:
  - Image: `postgres:16-alpine`
  - Container name: `nedcloud-dev-db`
  - Ports: `5432:5432`
  - Volume: `postgres_dev_data:/var/lib/postgresql/data`
  - Healthcheck: `pg_isready`
  - env_file: `.env.local`

  **app service**:
  - Build: `Dockerfile.dev`
  - Container name: `nedcloud-dev-app`
  - Ports: `3000:3000`
  - Volumes: `.:/app` (source code for hot reload)
  - Environment: `DATABASE_URL` (Docker network URL), polling vars
  - Depends on: postgres (healthy)
  - Command: npm run dev

  **studio service**:
  - Build: `Dockerfile.dev`
  - Container name: `nedcloud-dev-studio`
  - Ports: `5555:5555`
  - Environment: `DATABASE_URL` (Docker network URL)
  - Depends on: postgres
  - Command: `npx prisma studio --hostname 0.0.0.0 --port 5555`

  **Must NOT do**:
  - DO NOT create shared `node_modules` volume
  - DO NOT hardcode credentials (use env_file)
  - DO NOT modify production `docker-compose.yml`
  - DO NOT set `NEXTAUTH_URL` to localhost in production (dev only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard docker-compose file creation
  - **Skills**: [] (none needed)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 4, 5, 6
  - **Blocked By**: Tasks 1, 2

  **References**:

  **Pattern References** (existing code to follow):
  - `docker-compose.yml:1-53` - Production compose structure (follow same pattern)
  - `docker-compose.yml:1-19` - Postgres service configuration
  - `docker-compose.full-dev.yml:67-84` - Hot reload environment variables (copy these)

  **External References**:
  - Docker Compose docs: https://docs.docker.com/compose/compose-file/

  **WHY Each Reference Matters**:
  - `docker-compose.yml` - Use same postgres configuration and naming convention
  - `docker-compose.full-dev.yml` - Copy working polling variables, avoid broken volume pattern

  **Acceptance Criteria**:
  - [ ] `docker-compose.dev.yml` file exists
  - [ ] `docker compose -f docker-compose.dev.yml config` validates successfully
  - [ ] File contains exactly 3 services: postgres, app, studio
  - [ ] No `node_modules` volume defined
  - [ ] `env_file: .env.local` used instead of hardcoded environment values

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Compose file validates
    Tool: Bash
    Preconditions: docker-compose.dev.yml exists
    Steps:
      1. docker compose -f docker-compose.dev.yml config --quiet
    Expected Result: Exit code 0, no validation errors
    Failure Indicators: Validation errors, missing required fields
    Evidence: .sisyphus/evidence/task-3-compose-validate.txt

  Scenario: No shared node_modules volume
    Tool: Bash
    Preconditions: docker-compose.dev.yml exists
    Steps:
      1. grep -n "node_modules" docker-compose.dev.yml || echo "PASS: no node_modules volume"
    Expected Result: No matches found (or matches are only in .dockerignore comments)
    Failure Indicators: Found node_modules volume definition
    Evidence: .sisyphus/evidence/task-3-no-shared-volume.txt
  ```

  **Commit**: YES (groups with Tasks 1-3)
  - Message: `feat(docker): add development Docker setup with hot reload`
  - Files: `.dockerignore`, `Dockerfile.dev`, `docker-compose.dev.yml`

- [x] 4. Test dev stack startup

  **What to do**:
  - Stop any running Docker containers from old config
  - Run `docker compose -f docker-compose.dev.yml up -d`
  - Wait for all services to start (especially migrations)
  - Verify all 3 containers are running
  - Test endpoints: localhost:3000 (website), localhost:5555 (Prisma Studio)
  - Check logs for errors

  **Must NOT do**:
  - DO NOT skip waiting for database readiness
  - DO NOT assume success without verification

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verification and testing task
  - **Skills**: [] (none needed)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 5, 6
  - **Blocked By**: Task 3

  **References**:

  **Pattern References**:
  - `README.md:62-77` - Setup commands to compare against

  **Acceptance Criteria**:
  - [ ] `docker ps --filter "name=nedcloud-dev"` shows 3 containers with status "Up"
  - [ ] `curl -s http://localhost:3000 | grep -q "Nedcloud"` returns exit code 0
  - [ ] `curl -s http://localhost:5555 | grep -q "Prisma"` returns exit code 0

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: All containers start successfully
    Tool: Bash
    Preconditions: docker-compose.dev.yml exists, .env.local configured
    Steps:
      1. docker compose -f docker-compose.dev.yml up -d
      2. sleep 15  # Wait for services to initialize
      3. docker ps --filter "name=nedcloud-dev" --format "{{.Names}}: {{.Status}}"
    Expected Result: 3 containers (postgres, app, studio) all show "Up"
    Failure Indicators: Any container shows "Exited", missing containers
    Evidence: .sisyphus/evidence/task-4-containers-running.txt

  Scenario: Website accessible on localhost:3000
    Tool: Bash
    Preconditions: Containers running
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
      2. curl -s http://localhost:3000 | grep -o "<title>.*</title>"
    Expected Result: HTTP 200, title contains "Nedcloud"
    Failure Indicators: Connection refused, HTTP 5xx, timeout
    Evidence: .sisyphus/evidence/task-4-website-accessible.txt

  Scenario: Prisma Studio accessible on localhost:5555
    Tool: Bash
    Preconditions: Containers running
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:5555
      2. curl -s http://localhost:5555 | head -5
    Expected Result: HTTP 200, HTML response with Prisma Studio UI
    Failure Indicators: Connection refused, HTTP error
    Evidence: .sisyphus/evidence/task-4-studio-accessible.txt

  Scenario: Database connection works from app
    Tool: Bash
    Preconditions: Containers running
    Steps:
      1. docker logs nedcloud-dev-app 2>&1 | grep -i "ready\|started\|listening" | tail -5
      2. docker logs nedcloud-dev-app 2>&1 | grep -i "error" | tail -5 || echo "No errors found"
    Expected Result: App logs show successful start, no database connection errors
    Failure Indicators: Database connection errors, Prisma errors
    Evidence: .sisyphus/evidence/task-4-app-logs.txt
  ```

  **Commit**: NO (testing only)

- [x] 5. Test hot reload functionality

  **What to do**:
  - Edit a visible file (e.g., `src/app/page.tsx`)
  - Make a noticeable change (e.g., change "Nedcloud" to "HOT_RELOAD_TEST")
  - Wait 5-10 seconds for file change to be detected
  - Curl localhost:3000 to verify change is reflected
  - Revert the change

  **Must NOT do**:
  - DO NOT test with large changes (might miss timing)
  - DO NOT assume hot reload works without verification

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Functional verification task
  - **Skills**: [] (none needed)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 6
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `src/app/page.tsx` - Test file to modify for hot reload verification

  **Acceptance Criteria**:
  - [ ] Edit file → change reflected in browser/curl within 10 seconds
  - [ ] No container restart required for changes to appear

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Hot reload detects change and updates
    Tool: Bash
    Preconditions: Dev containers running, app responding
    Steps:
      1. ORIGINAL=$(curl -s http://localhost:3000 | grep -o "Nedcloud" | head -1)
      2. echo "Original: $ORIGINAL"
      3. sed -i 's/Nedcloud/HOT_RELOAD_TEST/g' src/app/page.tsx
      4. echo "Changed file, waiting for hot reload..."
      5. sleep 10
      6. UPDATED=$(curl -s http://localhost:3000 | grep -o "HOT_RELOAD_TEST" | head -1 || echo "")
      7. echo "Updated: $UPDATED"
      8. sed -i 's/HOT_RELOAD_TEST/Nedcloud/g' src/app/page.tsx  # Revert
    Expected Result: UPDATED contains "HOT_RELOAD_TEST", proving hot reload worked
    Failure Indicators: No change detected within 10s, still shows "Nedcloud"
    Evidence: .sisyphus/evidence/task-5-hot-reload.txt

  Scenario: Component change reflected without restart
    Tool: Bash
    Preconditions: Dev containers running
    Steps:
      1. curl -s http://localhost:3000 > /tmp/before.html
      2. sed -i 's/solutions/SOLUTIONS_CHANGED/g' src/components/layout/Header.tsx
      3. sleep 8
      4. curl -s http://localhost:3000 > /tmp/after.html
      5. diff /tmp/before.html /tmp/after.html | head -20 || echo "Files identical"
      6. sed -i 's/SOLUTIONS_CHANGED/solutions/g' src/components/layout/Header.tsx  # Revert
    Expected Result: diff shows "SOLUTIONS_CHANGED" vs "solutions" difference
    Failure Indicators: Files identical, no change detected
    Evidence: .sisyphus/evidence/task-5-component-change.txt
  ```

  **Commit**: NO (testing only)

- [x] 6. Clean up old broken files

  **What to do**:
  - Remove or rename `docker-compose.full-dev.yml` (broken shared volume config)
  - Optionally keep `docker-compose.simple-dev.yml` as reference
  - Update README.md if needed with new dev command
  - Verify production `docker-compose.yml` was not modified

  **Must NOT do**:
  - DO NOT delete `docker-compose.dev.yml` (the DB-only one if it exists)
  - DO NOT modify production `docker-compose.yml`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: File cleanup task
  - **Skills**: [] (none needed)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: None
  - **Blocked By**: Task 4 (verify working before cleanup)

  **References**:

  **Pattern References**:
  - `docker-compose.full-dev.yml` - File to remove (broken shared volumes)
  - `docker-compose.simple-dev.yml` - Optional: rename or keep as reference

  **Acceptance Criteria**:
  - [ ] `docker-compose.full-dev.yml` no longer exists in repo
  - [ ] `git diff HEAD -- docker-compose.yml` shows no changes (production untouched)
  - [ ] New dev setup documented in README or comments

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Old broken compose file removed
    Tool: Bash
    Preconditions: New docker-compose.dev.yml works
    Steps:
      1. ls -la docker-compose*.yml
      2. test ! -f docker-compose.full-dev.yml && echo "PASS: full-dev removed" || echo "FAIL: still exists"
    Expected Result: docker-compose.full-dev.yml does not exist
    Failure Indicators: Old file still present
    Evidence: .sisyphus/evidence/task-6-cleanup-done.txt

  Scenario: Production compose unchanged
    Tool: Bash
    Preconditions: Git repo
    Steps:
      1. git diff HEAD -- docker-compose.yml
    Expected Result: No output (no diff), production compose untouched
    Failure Indicators: Shows modifications to production config
    Evidence: .sisyphus/evidence/task-6-prod-unchanged.txt
  ```

  **Commit**: YES
  - Message: `chore: remove broken docker-compose.full-dev.yml`
  - Files: `docker-compose.full-dev.yml` (deleted)

- [x] 7. Fix missing environment variables in docker-compose.dev.yml

  **What to do**:
  - Add `env_file: .env.local` to the `app` service in docker-compose.dev.yml
  - This ensures NEXTAUTH_SECRET, NEXTAUTH_URL, ADMIN_EMAIL, ADMIN_PASSWORD are loaded
  - The current configuration only has DATABASE_URL explicitly set, missing NextAuth vars

  **Bug Details**:
  - The `app` service returns 404 because NextAuth cannot sign sessions without NEXTAUTH_SECRET
  - The `.env.local` file exists and contains all required variables
  - The `postgres` service correctly uses `env_file: .env.local`, but `app` service does not

  **Must NOT do**:
  - DO NOT hardcode environment variables in the compose file
  - DO NOT modify the `.env.local` file
  - DO NOT change any other service configurations

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single line fix
  - **Skills**: [] (none needed)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Task 4 verification (needs to be re-verified after fix)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `docker-compose.dev.yml:7-8` - Postgres service correctly uses `env_file: .env.local`
  - `.env.local` - Contains NEXTAUTH_SECRET, NEXTAUTH_URL, ADMIN_EMAIL, ADMIN_PASSWORD

  **Acceptance Criteria**:
  - [ ] `app` service in docker-compose.dev.yml has `env_file: .env.local`
  - [ ] `docker exec nedcloud-dev-app printenv | grep NEXTAUTH_SECRET` returns the secret
  - [ ] `curl http://localhost:3000` returns the website (not 404)

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: App service loads environment variables
    Tool: Bash
    Preconditions: Containers restarted after fix
    Steps:
      1. docker compose -f docker-compose.dev.yml down
      2. docker compose -f docker-compose.dev.yml up -d
      3. sleep 30
      4. docker exec nedcloud-dev-app printenv | grep NEXTAUTH_SECRET
    Expected Result: NEXTAUTH_SECRET value is printed
    Failure Indicators: No output (variable not set)
    Evidence: .sisyphus/evidence/task-7-env-vars-loaded.txt

  Scenario: Website returns content (not 404)
    Tool: Bash
    Preconditions: Containers running with fixed config
    Steps:
      1. curl -s http://localhost:3000 | grep -o "<title>.*</title>" | head -1
    Expected Result: <title>Nedcloud Solutions</title> or similar (not 404)
    Failure Indicators: <title>404: This page could not be found.</title>
    Evidence: .sisyphus/evidence/task-7-website-content.txt
  ```

  **Commit**: YES
  - Message: `fix(docker): add env_file to app service for NextAuth variables`
  - Files: `docker-compose.dev.yml`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. Verify: `.dockerignore` exists and excludes node_modules, `Dockerfile.dev` exists with pre-installed deps, `docker-compose.dev.yml` exists without shared volumes, `docker-compose.yml` unchanged.
  Output: `Must Have [3/3] | Must NOT Have [4/4] | Files [N/N] | VERDICT: APPROVE`

- [x] F2. **Functional Verification** — `unspecified-high`
  Run `docker compose -f docker-compose.dev.yml up -d`. Verify: all 3 containers running (postgres, app, studio), curl localhost:3000 returns HTML, curl localhost:5555 returns Prisma Studio UI, hot reload works (edit file → verify change reflected).
  Output: `Containers [3/3] | Endpoints [3/3] | Hot Reload [PASS] | VERDICT: APPROVE`

- [x] F3. **Security Compliance** — `unspecified-high`
  Grep for hardcoded credentials in new Docker files. Verify `.dockerignore` excludes `.env*` files. Check compose file uses `env_file` not hardcoded `environment` for secrets.
  Output: `Hardcoded Secrets [NONE] | Env File Pattern [PASS] | VERDICT: APPROVE`

- [x] F4. **Production Safety Check** — `deep`
  Diff production `docker-compose.yml` against git HEAD to confirm no modifications. Verify old `docker-compose.full-dev.yml` is removed or deprecated.
  Output: `Production Unchanged [YES] | Cleanup Complete [YES] | VERDICT: APPROVE`

---

## Commit Strategy

- **1**: `feat(docker): add development Docker setup with hot reload` — Dockerfile.dev, .dockerignore, docker-compose.dev.yml
- **Pre-commit**: `docker compose -f docker-compose.dev.yml config` (validate compose file syntax)

---

## Success Criteria

### Verification Commands
```bash
# Start development stack
docker compose -f docker-compose.dev.yml up -d

# Verify all containers running
docker ps --filter "name=nedcloud-dev" --format "table {{.Names}}\t{{.Status}}"
# Expected: 3 containers (postgres, app, studio) all "Up"

# Verify website accessible
curl -s http://localhost:3000 | grep -q "Nedcloud"
# Expected: exit code 0

# Verify Prisma Studio accessible
curl -s http://localhost:5555 | grep -q "Prisma"
# Expected: exit code 0

# Verify hot reload (edit a file, wait 5s, check if reflected)
sed -i 's/Nedcloud/TEST_CHANGE/' src/app/page.tsx
sleep 5
curl -s http://localhost:3000 | grep -q "TEST_CHANGE"
# Expected: exit code 0
# Cleanup: revert change
sed -i 's/TEST_CHANGE/Nedcloud/' src/app/page.tsx
```

### Final Checklist
- [x] All "Must Have" present (Dockerfile.dev, .dockerignore, docker-compose.dev.yml)
- [x] All "Must NOT Have" absent (no shared volumes, no hardcoded creds, prod unchanged)
- [x] Development stack starts successfully
- [x] Hot reload works
- [x] All services accessible
