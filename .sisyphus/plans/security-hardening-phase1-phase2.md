# Security Hardening: Phase 1 & Phase 2 Implementation Plan

**Created:** 2026-02-16
**Priority:** HIGH
**Estimated Effort:** Phase 1 (2-3 days), Phase 2 (5-7 days)
**Target Completion:** Phase 1 within 1 week, Phase 2 within 3 weeks

---

## TL;DR

> **Goal:** Harden nedcloudsolutions.nl security by removing information leaks, implementing backups, adding comprehensive logging, and enabling two-factor authentication.
>
> **Deliverables:**
> - Phase 1: Header hardening, backup system, basic security logging, cache fixes
> - Phase 2: CSP strengthening, TOTP 2FA implementation, comprehensive logging, backup verification
>
> **Pre-implementation Testing:** SecurityHeaders.com score: B → Target: A+
> **Post-implementation Testing:** A+ grade, automated backups verified, 2FA working

---

## Context

### Current Security Posture

**What's Already Good:**
- HTTPS with HSTS enabled
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- HttpOnly, Secure, SameSite cookies
- Rate limiting on login (10/min) and API (100/min)
- Content Security Policy implemented
- XSS prevention with DOMPurify

**Issues to Address:**
- `X-Powered-By: Next.js` header visible (information disclosure)
- CSP allows `unsafe-inline` and `unsafe-eval` (weakening CSP)
- Login page cached for extended period
- No automated backup system
- No two-factor authentication
- Limited security logging

### User Requirements

| Requirement | Choice |
|-------------|--------|
| 2FA Method | TOTP Authenticator App (Google Authenticator, Authy, etc.) |
| Backup Status | No automated backups currently (CRITICAL - adding to Phase 1) |
| Logging Level | Comprehensive (page visits, clicks, form submissions, errors) |
| Implementation | Developer will implement |

---

## Phase 1: Quick Wins (2-3 days)

### Priority: HIGH | Urgency: DO NOW

These are low-risk configuration changes with immediate security benefits.

---

## TODOs

### Wave 1: Immediate Security Fixes (Day 1)

> **Goal:** Remove information leaks and fix cache configuration
> **Parallel Tasks:** 4 tasks can run simultaneously

- [x] 1. Remove X-Powered-By Header

  **What to do:**
  - Remove the `X-Powered-By: Next.js` response header to prevent technology fingerprinting
  - This header tells attackers what framework/version the site uses, making targeted attacks easier
  
  **Implementation:**
  - Edit `next.config.ts` to remove the header
  - Add header removal in the `headers()` function
  
  **File to modify:** `next.config.ts`
  
  **Code change:**
  ```typescript
  // In next.config.ts, add to the headers configuration:
  {
    key: 'X-Powered-By',
    value: '', // Remove this header
  }
  ```
  
  **Alternative approach (remove entirely):**
  ```typescript
  // In next.config.ts
  const nextConfig = {
    // ... other config
    poweredByHeader: false, // This disables X-Powered-By completely
  }
  ```
  
  **Must NOT do:**
  - Do not add new headers that reveal other technology information
  - Do not break existing security headers
  
  **Recommended Agent Profile:**
  - **Category:** `quick`
    - Reason: Simple configuration change with minimal risk
  - **Skills:** None required
  
  **Parallelization:**
  - **Can Run In Parallel:** YES
  - **Parallel Group:** Wave 1 (with Tasks 2, 3, 4)
  - **Blocks:** Phase 2 tasks (indirectly - removes info for attackers)
  - **Blocked By:** None (can start immediately)
  
  **References:**
  - `next.config.ts:1-100` - Current header configuration
  - Next.js docs: https://nextjs.org/docs/api-reference/next.config.js/disabling-x-powered-by
  
  **Acceptance Criteria:**
  - [ ] `X-Powered-By` header no longer appears in HTTP responses
  - [ ] Run: `curl -I https://nedcloudsolutions.nl/ | grep -i "x-powered-by"` returns nothing
  - [ ] SecurityHeaders.com scan no longer reports "X-Powered-By header detected"
  
  **QA Scenarios:**
  ```
  Scenario: Header removal verification
    Tool: Bash (curl)
    Preconditions: Site is deployed and accessible
    Steps:
      1. curl -I "https://nedcloudsolutions.nl/" 2>/dev/null | grep -i "x-powered-by"
      2. If output is empty, header is removed
      3. If output shows "X-Powered-By", task is not complete
    Expected Result: No X-Powered-By header in response
    Failure Indicators: Header still present, shows framework version
    Evidence: .sisyphus/evidence/task-1-header-removed.txt
  ```
  
  **Commit:** YES
  - Message: `security: remove X-Powered-By header to prevent fingerprinting`
  - Files: `next.config.ts`

- [x] 2. Add Noindex to Admin Pages

  **What to do:**
  - Add `X-Robots-Tag: noindex, nofollow` header to all admin pages
  - Prevents search engines from indexing admin areas
  - Reduces visibility of sensitive admin login URLs
  
  **Implementation:**
  - Add middleware to set noindex headers for `/admin/*` routes
  - Or add meta tags in admin page components
  
  **Files to modify:**
  - `src/middleware.ts` - Add header for admin routes
  - Or `src/app/admin/layout.tsx` - Add meta tag
  
  **Code change (middleware approach - recommended):**
  ```typescript
  // In src/middleware.ts
  import { NextResponse } from 'next/server'
  import type { NextRequest } from 'next/server'
  
  export function middleware(request: NextRequest) {
    const response = NextResponse.next()
    
    // Add noindex header for admin routes
    if (request.nextUrl.pathname.startsWith('/admin')) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    }
    
    return response
  }
  ```
  
  **Code change (meta tag approach - alternative):**
  ```typescript
  // In src/app/admin/layout.tsx
  export const metadata: Metadata = {
    robots: 'noindex, nofollow',
  }
  ```
  
  **Must NOT do:**
  - Do not apply noindex to public pages (would hurt SEO)
  - Do not block `/api` routes from being indexed if they have public documentation
  
  **Recommended Agent Profile:**
  - **Category:** `quick`
    - Reason: Simple middleware or metadata addition
  - **Skills:** None required
  
  **Parallelization:**
  - **Can Run In Parallel:** YES
  - **Parallel Group:** Wave 1 (with Tasks 1, 3, 4)
  - **Blocks:** None
  - **Blocked By:** None (can start immediately)
  
  **References:**
  - `src/middleware.ts` - Current middleware configuration
  - `src/app/admin/layout.tsx` - Admin layout component
  
  **Acceptance Criteria:**
  - [ ] `/admin/login` returns `X-Robots-Tag: noindex, nofollow` header
  - [ ] `/admin/*` pages return noindex header
  - [ ] Public pages (`/`, `/about`, `/services`) do NOT have noindex
  - [ ] Run: `curl -I https://nedcloudsolutions.nl/admin/login | grep -i "robots"`
  
  **QA Scenarios:**
  ```
  Scenario: Admin pages have noindex
    Tool: Bash (curl)
    Preconditions: Site is deployed
    Steps:
      1. curl -I "https://nedcloudsolutions.nl/admin/login" | grep -i "robots"
      2. Verify "noindex, nofollow" is present
    Expected Result: X-Robots-Tag: noindex, nofollow
    Evidence: .sisyphus/evidence/task-2-noindex-admin.txt

  Scenario: Public pages remain indexable
    Tool: Bash (curl)
    Preconditions: Site is deployed
    Steps:
      1. curl -I "https://nedcloudsolutions.nl/" | grep -i "robots"
      2. Verify no noindex header (or appropriate index header)
    Expected Result: No noindex header on public pages
    Evidence: .sisyphus/evidence/task-2-public-indexable.txt
  ```
  
  **Commit:** YES
  - Message: `security: add noindex header to admin pages`
  - Files: `src/middleware.ts` or `src/app/admin/layout.tsx`

- [x] 3. Reduce Login Page Cache Duration

  **What to do:**
  - Reduce cache duration on `/admin/login` page from current value to 1 hour max
  - Ensures security updates are applied quickly
  - Prevents stale cached login pages from being served
  
  **Implementation:**
  - Configure cache headers for login page specifically
  - Prevent long-term caching of authentication-related pages
  
  **Files to modify:**
  - `src/app/admin/login/page.tsx` - Add cache control
  - Or `next.config.ts` - Add header rule for login page
  
  **Code change:**
  ```typescript
  // In src/app/admin/login/page.tsx
  export const dynamic = 'force-dynamic'
  
  // Or in next.config.ts headers function:
  {
    source: '/admin/login',
    headers: [
      {
        key: 'Cache-Control',
        value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    ],
  }
  ```
  
  **Must NOT do:**
  - Do not disable caching for all pages (would hurt performance)
  - Do not cache login pages for extended periods
  
  **Recommended Agent Profile:**
  - **Category:** `quick`
    - Reason: Single configuration change
  - **Skills:** None required
  
  **Parallelization:**
  - **Can Run In Parallel:** YES
  - **Parallel Group:** Wave 1 (with Tasks 1, 2, 4)
  - **Blocks:** None
  - **Blocked By:** None (can start immediately)
  
  **References:**
  - `src/app/admin/login/page.tsx` - Login page component
  - `next.config.ts` - Current cache configuration
  
  **Acceptance Criteria:**
  - [ ] `/admin/login` returns `Cache-Control` with no-store or max-age <= 3600
  - [ ] Public pages still have appropriate caching for performance
  - [ ] Run: `curl -I https://nedcloudsolutions.nl/admin/login | grep -i "cache-control"`
  
  **QA Scenarios:**
  ```
  Scenario: Login page is not cached
    Tool: Bash (curl)
    Preconditions: Site is deployed
    Steps:
      1. curl -I "https://nedcloudsolutions.nl/admin/login" | grep -i "cache-control"
      2. Verify no-cache, no-store, or max-age <= 3600
    Expected Result: Cache-Control prevents long-term caching
    Evidence: .sisyphus/evidence/task-3-login-cache.txt
  ```
  
  **Commit:** YES
  - Message: `security: reduce cache duration on login page`
  - Files: `src/app/admin/login/page.tsx` or `next.config.ts`

- [x] 4. Verify Rate Limiting is Active

  **What to do:**
  - Verify rate limiting is working correctly on authentication endpoints
  - Ensure login attempts are limited to 10 per minute
  - Document rate limiting behavior for future reference
  
  **Implementation:**
  - Test rate limiting by making rapid requests
  - Verify 429 response after limit is exceeded
  - Check rate limit configuration in code
  
  **Files to verify:**
  - `src/lib/rateLimit.ts` - Rate limiting implementation
  - `src/lib/security.config.ts` - Rate limit configuration
  
  **Testing approach:**
  ```bash
  # Test auth rate limiting (should trigger after 10 requests)
  for i in {1..15}; do
    curl -s -o /dev/null -w "%{http_code}\n" \
      -X POST "https://nedcloudsolutions.nl/api/auth/callback/credentials" \
      -H "X-Forwarded-For: 192.168.1.100" \
      -d '{"email":"test@test.com","password":"wrong"}'
  done
  # Should see 401 for first ~10, then 429 for remaining
  ```
  
  **Must NOT do:**
  - Do not perform DoS testing (stay within reasonable limits)
  - Do not test from production IP (use test IP header)
  
  **Recommended Agent Profile:**
  - **Category:** `quick`
    - Reason: Verification task, minimal code changes
  - **Skills:** None required
  
  **Parallelization:**
  - **Can Run In Parallel:** YES
  - **Parallel Group:** Wave 1 (with Tasks 1, 2, 3)
  - **Blocks:** None (verification only)
  - **Blocked By:** None (can start immediately)
  
  **References:**
  - `src/lib/rateLimit.ts:1-50` - Rate limiting implementation
  - `src/lib/security.config.ts:1-30` - Configuration values
  
  **Acceptance Criteria:**
  - [ ] Rate limiting returns 429 after 10 auth requests per minute
  - [ ] Rate limiting returns 429 after 100 API requests per minute
  - [ ] Rate limit headers (`Retry-After`) are present in 429 responses
  - [ ] Documentation updated with rate limit values
  
  **QA Scenarios:**
  ```
  Scenario: Auth rate limiting triggers correctly
    Tool: Bash (curl loop)
    Preconditions: Site is deployed and accessible
    Steps:
      1. Run 15 rapid requests to auth endpoint
      2. Count HTTP 429 responses
      3. Verify 429 appears after ~10 requests
    Expected Result: At least 3 responses return 429
    Failure Indicators: All responses return 401 (rate limiting not working)
    Evidence: .sisyphus/evidence/task-4-rate-limit-auth.txt

  Scenario: API rate limiting triggers correctly
    Tool: Bash (curl loop)
    Preconditions: Site is deployed
    Steps:
      1. Run 110 rapid requests to API endpoint
      2. Count HTTP 429 responses
      3. Verify 429 appears after ~100 requests
    Expected Result: At least 5 responses return 429
    Evidence: .sisyphus/evidence/task-4-rate-limit-api.txt
  ```
  
  **Commit:** NO
  - This is a verification task, documentation only

---

### Wave 2: Critical Infrastructure (Days 2-3)

> **Goal:** Implement backup system (CRITICAL - currently no backups)
> **Parallel Tasks:** 2 tasks can run simultaneously

- [x] 5. Implement Automated Database Backup System

  **What to do:**
  - Set up automated PostgreSQL database backups
  - Current state: NO automated backups (CRITICAL RISK)
  - Configure daily backups with 7-day retention minimum
  - Store backups in a secure, separate location
  
  **Implementation options:**
  - Option A: Docker volume backup scripts
  - Option B: pg_dump automated scripts
  - Option C: Cloud provider backup service
  
  **Files to create:**
  - `scripts/backup.sh` - Backup script
  - `scripts/restore.sh` - Restore script
  - `.env.backup.example` - Backup configuration template
  
  **Code change (pg_dump approach):**
  ```bash
  #!/bin/bash
  # scripts/backup.sh
  
  BACKUP_DIR="/var/backups/nedcloud"
  DATE=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="$BACKUP_DIR/nedcloud_$DATE.sql.gz"
  
  # Create backup directory
  mkdir -p "$BACKUP_DIR"
  
  # Create backup
  pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
  
  # Delete backups older than 7 days
  find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
  
  echo "Backup created: $BACKUP_FILE"
  ```
  
  **Cron job:**
  ```cron
  # Daily backup at 2 AM
  0 2 * * * /path/to/scripts/backup.sh >> /var/log/nedcloud-backup.log 2>&1
  ```
  
  **Docker Compose addition:**
  ```yaml
  # Add to docker-compose.yml
  backup:
    image: postgres:16-alpine
    volumes:
      - ./backups:/backups
    environment:
      - DATABASE_URL=${DATABASE_URL}
    command: |
      sh -c "while true; do
        pg_dump $$DATABASE_URL | gzip > /backups/backup_$$(date +%Y%m%d_%H%M%S).sql.gz
        find /backups -name '*.sql.gz' -mtime +7 -delete
        sleep 86400
      done"
  ```
  
  **Must NOT do:**
  - Do not store backups in the same server/location as the database
  - Do not skip encryption for backup files containing sensitive data
  - Do not keep backups indefinitely (disk space issues)
  
  **Recommended Agent Profile:**
  - **Category:** `unspecified-high`
    - Reason: Infrastructure setup requires careful consideration
  - **Skills:** None required
  
  **Parallelization:**
  - **Can Run In Parallel:** YES
  - **Parallel Group:** Wave 2 (with Task 6)
  - **Blocks:** Task 9 (backup verification)
  - **Blocked By:** None (can start immediately)
  
  **References:**
  - `docker-compose.yml` - Current Docker configuration
  - `prisma/schema.prisma` - Database schema (for restore testing)
  - `.env.example` - Environment variables
  
  **Acceptance Criteria:**
  - [ ] Automated backup script created and tested
  - [ ] Backups stored in secure location (not same server)
  - [ ] 7-day retention configured and verified
  - [ ] Backup script runs via cron or Docker
  - [ ] Backup log files created
  
  **QA Scenarios:**
  ```
  Scenario: Backup creates valid SQL dump
    Tool: Bash
    Preconditions: Database has data
    Steps:
      1. Run ./scripts/backup.sh
      2. Verify .sql.gz file created in backup directory
      3. Verify file is not empty (gunzip -c file.sql.gz | head)
    Expected Result: Backup file exists and contains SQL
    Evidence: .sisyphus/evidence/task-5-backup-created.txt

  Scenario: Old backups are cleaned up
    Tool: Bash
    Preconditions: Multiple backup files exist (simulate with touch -d)
    Steps:
      1. Create test backup files with old dates
      2. Run backup script
      3. Verify files older than 7 days are deleted
    Expected Result: Only recent backups remain
    Evidence: .sisyphus/evidence/task-5-backup-cleanup.txt
  ```
  
  **Commit:** YES
  - Message: `infra: add automated database backup system`
  - Files: `scripts/backup.sh`, `scripts/restore.sh`, `docker-compose.yml`

- [x] 6. Implement Basic Security Logging

  **What to do:**
  - Set up security event logging for critical actions
  - Log failed login attempts, admin access, API errors
  - Create structured logs for easy analysis
  - Store logs securely with rotation
  
  **Implementation:**
  - Create logging utility for security events
  - Integrate with authentication flow
  - Set up log rotation and retention
  
  **Files to create/modify:**
  - `src/lib/security-logger.ts` - Security logging utility (NEW)
  - `src/lib/auth.ts` - Add login attempt logging
  - `src/middleware.ts` - Add access logging
  
  **Code change:**
  ```typescript
  // src/lib/security-logger.ts
  import fs from 'fs'
  import path from 'path'
  
  export type SecurityEventType = 
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'LOGOUT'
    | 'ADMIN_ACCESS'
    | 'API_ERROR'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SUSPICIOUS_REQUEST'
  
  export interface SecurityLogEntry {
    timestamp: string
    event: SecurityEventType
    ip: string
    userAgent: string
    userId?: string
    email?: string
    details?: Record<string, unknown>
  }
  
  const LOG_DIR = path.join(process.cwd(), 'logs')
  const LOG_FILE = path.join(LOG_DIR, 'security.log')
  
  export function logSecurityEvent(
    event: SecurityEventType,
    request: Request,
    details?: Record<string, unknown>
  ) {
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      event,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      details,
    }
    
    // Ensure log directory exists
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true })
    }
    
    // Append to log file
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n')
    
    // Also log to console for development
    console.log('[SECURITY]', JSON.stringify(entry))
  }
  ```
  
  **Integration in auth.ts:**
  ```typescript
  import { logSecurityEvent } from './security-logger'
  
  // In login handler:
  if (user) {
    logSecurityEvent('LOGIN_SUCCESS', request, { userId: user.id, email: user.email })
  } else {
    logSecurityEvent('LOGIN_FAILURE', request, { email: credentials.email })
  }
  ```
  
  **Log rotation (add to package.json scripts):**
  ```json
  {
    "scripts": {
      "logs:rotate": "logrotate -f /etc/logrotate.d/nedcloud-security"
    }
  }
  ```
  
  **Must NOT do:**
  - Do not log passwords or sensitive credentials
  - Do not store logs in public directories
  - Do not log every single request (performance impact)
  
  **Recommended Agent Profile:**
  - **Category:** `quick`
    - Reason: Utility function creation with integration
  - **Skills:** None required
  
  **Parallelization:**
  - **Can Run In Parallel:** YES
  - **Parallel Group:** Wave 2 (with Task 5)
  - **Blocks:** Phase 2 logging enhancement (Task 10)
  - **Blocked By:** None (can start immediately)
  
  **References:**
  - `src/lib/auth.ts` - Authentication configuration
  - `src/middleware.ts` - Current middleware
  - `src/lib/security.config.ts` - Security configuration
  
  **Acceptance Criteria:**
  - [ ] Security events are logged to `logs/security.log`
  - [ ] Log format is structured JSON for easy parsing
  - [ ] Failed login attempts are logged
  - [ ] Successful admin logins are logged
  - [ ] Logs do not contain sensitive data (passwords, tokens)
  
  **QA Scenarios:**
  ```
  Scenario: Failed login is logged
    Tool: Bash + manual login attempt
    Preconditions: Site is running
    Steps:
      1. Attempt login with wrong password
      2. Check logs/security.log for LOGIN_FAILURE entry
      3. Verify IP, email, and timestamp are recorded
    Expected Result: LOGIN_FAILURE entry exists in log
    Evidence: .sisyphus/evidence/task-6-login-failure-log.txt

  Scenario: Successful login is logged
    Tool: Bash + manual login
    Preconditions: Admin account exists
    Steps:
      1. Login with correct credentials
      2. Check logs/security.log for LOGIN_SUCCESS entry
      3. Verify userId is recorded
    Expected Result: LOGIN_SUCCESS entry exists in log
    Evidence: .sisyphus/evidence/task-6-login-success-log.txt
  ```
  
  **Commit:** YES
  - Message: `security: add security event logging`
  - Files: `src/lib/security-logger.ts`, `src/lib/auth.ts`

---

## Phase 2: Deeper Hardening (5-7 days)

### Priority: MEDIUM-HIGH | Urgency: DO SOON

These require more careful implementation and testing.

---

### Wave 3: CSP Strengthening (Days 4-5)

> **Goal:** Strengthen Content Security Policy by removing unsafe directives
> **Dependency:** Phase 1 complete

- [x] 7. Strengthen Content Security Policy

  **What to do:**
  - Remove `unsafe-inline` and `unsafe-eval` from CSP where possible
  - Implement nonces or hashes for inline scripts
  - Test thoroughly to ensure no functionality breaks
  - This is complex and may require significant code changes
  
  **Implementation approach:**
  - Phase 1: Audit current inline scripts
  - Phase 2: Move inline scripts to external files where possible
  - Phase 3: Add nonces for required inline scripts
  - Phase 4: Test all functionality
  
  **Files to modify:**
  - `next.config.ts` - CSP configuration
  - `src/app/layout.tsx` - Add nonce support
  - Component files with inline scripts - Move to external files
  
  **Current CSP:**
  ```
  Content-Security-Policy: default-src 'self'; 
    script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
    style-src 'self' 'unsafe-inline'; 
    img-src 'self' data: https:; 
    font-src 'self' data:; 
    connect-src 'self' https:; 
    frame-ancestors 'self'; 
    base-uri 'self'; 
    form-action 'self'
  ```
  
  **Target CSP:**
  ```
  Content-Security-Policy: default-src 'self'; 
    script-src 'self' 'nonce-{RANDOM}'; 
    style-src 'self' 'nonce-{RANDOM}'; 
    img-src 'self' data: https:; 
    font-src 'self' data:; 
    connect-src 'self' https:; 
    frame-ancestors 'self'; 
    base-uri 'self'; 
    form-action 'self'
  ```
  
  **Code change (nonce implementation):**
  ```typescript
  // In next.config.ts
  import { randomBytes } from 'crypto'
  
  export function generateNonce() {
    return randomBytes(16).toString('base64')
  }
  
  // In middleware or headers function:
  const nonce = generateNonce()
  
  {
    key: 'Content-Security-Policy',
    value: `default-src 'self'; script-src 'self' 'nonce-${nonce}'; ...`
  }
  ```
  
  **Risk Assessment:**
  - HIGH risk of breaking inline scripts
  - REQUIRE thorough testing of all pages
  - START with report-only mode before enforcing
  
  **Recommended Agent Profile:**
  - **Category:** `deep`
    - Reason: Complex security change requiring thorough analysis
  - **Skills:** None required
  
  **Parallelization:**
  - **Can Run In Parallel:** NO
  - **Parallel Group:** Sequential (Wave 3)
  - **Blocks:** None
  - **Blocked By:** Phase 1 completion (need stable baseline)
  
  **References:**
  - `next.config.ts:1-100` - Current CSP configuration
  - MDN CSP Guide: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
  - Next.js CSP: https://nextjs.org/docs/advanced-features/security-headers
  
  **Acceptance Criteria:**
  - [ ] CSP does not contain `unsafe-inline` or `unsafe-eval`
  - [ ] All pages load and function correctly
  - [ ] No CSP violations in browser console
  - [ ] SecurityHeaders.com grade improves to A or A+
  
  **QA Scenarios:**
  ```
  Scenario: Homepage loads without CSP violations
    Tool: Playwright
    Preconditions: Site is deployed with new CSP
    Steps:
      1. Navigate to https://nedcloudsolutions.nl/
      2. Check browser console for CSP errors
      3. Verify all scripts execute correctly
      4. Verify all styles apply correctly
    Expected Result: No CSP violations, page renders correctly
    Evidence: .sisyphus/evidence/task-7-csp-homepage.png

  Scenario: Admin login works with new CSP
    Tool: Playwright
    Preconditions: Site is deployed with new CSP
    Steps:
      1. Navigate to https://nedcloudsolutions.nl/admin/login
      2. Enter credentials and submit
      3. Verify successful login
      4. Check console for CSP errors
    Expected Result: Login works, no CSP violations
    Evidence: .sisyphus/evidence/task-7-csp-admin-login.png

  Scenario: SecurityHeaders grade is A or A+
    Tool: Bash (curl) + SecurityHeaders.com
    Preconditions: Site is deployed with new CSP
    Steps:
      1. Run SecurityHeaders.com scan
      2. Check CSP score
      3. Verify overall grade is A or A+
    Expected Result: Grade A or A+
    Evidence: .sisyphus/evidence/task-7-securityheaders-grade.txt
  ```
  
  **Commit:** YES
  - Message: `security: strengthen CSP with nonces, remove unsafe directives`
  - Files: `next.config.ts`, `src/app/layout.tsx`, component files

---

### Wave 4: Two-Factor Authentication (Days 5-7)

> **Goal:** Implement TOTP-based 2FA for admin accounts
> **Complexity:** HIGH - requires database changes and UI updates

- [x] 8. Add Two-Factor Authentication (TOTP)

  **What to do:**
  - Implement TOTP (Time-based One-Time Password) 2FA
  - Users will use apps like Google Authenticator, Authy, or 1Password
  - Add 2FA setup flow in admin settings
  - Add 2FA verification in login flow
  - Provide backup codes for account recovery
  
  **Implementation components:**
  1. Database schema changes (add 2FA fields to User model)
  2. TOTP secret generation and QR code display
  3. 2FA verification during login
  4. Admin UI for 2FA setup/management
  5. Backup code generation
  
  **Files to create/modify:**
  - `prisma/schema.prisma` - Add 2FA fields to User model
  - `src/lib/totp.ts` - TOTP utility functions (NEW)
  - `src/app/api/auth/2fa/enable/route.ts` - Enable 2FA endpoint (NEW)
  - `src/app/api/auth/2fa/verify/route.ts` - Verify 2FA endpoint (NEW)
  - `src/app/admin/settings/2fa/page.tsx` - 2FA setup page (NEW)
  - `src/lib/auth.ts` - Add 2FA verification to login flow
  - `src/components/admin/TwoFactorSetup.tsx` - 2FA setup component (NEW)
  
  **Database schema change:**
  ```prisma
  // In prisma/schema.prisma, add to User model:
  model User {
    // ... existing fields
    twoFactorEnabled    Boolean   @default(false)
    twoFactorSecret     String?   // Encrypted TOTP secret
    twoFactorBackupCodes String[] // Encrypted backup codes
    twoFactorVerifiedAt DateTime? // When 2FA was verified
  }
  ```
  
  **Code change (TOTP utility):**
  ```typescript
  // src/lib/totp.ts
  import * as crypto from 'crypto'
  import { authenticator } from 'otplib'
  import qrcode from 'qrcode'
  
  export function generateTOTPSecret(email: string): string {
    return authenticator.generateSecret()
  }
  
  export function verifyTOTP(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret })
  }
  
  export async function generateQRCode(
    secret: string, 
    email: string
  ): Promise<string> {
    const otpauth = authenticator.keyuri(
      email, 
      'Nedcloud Solutions', 
      secret
    )
    return qrcode.toDataURL(otpauth)
  }
  
  export function generateBackupCodes(count = 8): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
    }
    return codes
  }
  ```
  
  **Dependencies to add:**
  ```json
  {
    "dependencies": {
      "otplib": "^12.0.1",
      "qrcode": "^1.5.3"
    }
  }
  ```
  
  **Must NOT do:**
  - Do NOT store TOTP secrets in plaintext (ENCRYPT THEM)
  - Do NOT skip backup codes (users need recovery option)
  - Do NOT make 2FA mandatory immediately (allow opt-in first)
  
  **Security considerations:**
  - Encrypt TOTP secrets before storing in database
  - Rate limit 2FA verification attempts
  - Invalidate backup codes after use
  - Notify users when 2FA is enabled/disabled
  
  **Recommended Agent Profile:**
  - **Category:** `deep`
    - Reason: Complex feature requiring database changes, API, and UI
  - **Skills:** None required
  
  **Parallelization:**
  - **Can Run In Parallel:** YES
  - **Parallel Group:** Wave 4 (with Task 9 if backup system is ready)
  - **Blocks:** None
  - **Blocked By:** None (but prefer Phase 1 complete)
  
  **References:**
  - `prisma/schema.prisma:User` - User model
  - `src/lib/auth.ts` - Authentication configuration
  - `src/app/admin/settings/` - Settings page
  - otplib docs: https://github.com/yeojz/otplib
  
  **Acceptance Criteria:**
  - [ ] User can enable 2FA in admin settings
  - [ ] QR code is generated and scannable by authenticator apps
  - [ ] 2FA verification is required during login if enabled
  - [ ] Backup codes are generated and can be used for recovery
  - [ ] User can disable 2FA with proper verification
  - [ ] TOTP secrets are encrypted in database
  
  **QA Scenarios:**
  ```
  Scenario: User can enable 2FA
    Tool: Playwright
    Preconditions: Admin user logged in, 2FA not enabled
    Steps:
      1. Navigate to /admin/settings/2fa
      2. Click "Enable 2FA"
      3. Verify QR code is displayed
      4. Scan with authenticator app (or use test code)
      5. Enter verification code
      6. Verify backup codes are shown
      7. Save backup codes
    Expected Result: 2FA enabled, backup codes provided
    Evidence: .sisyphus/evidence/task-8-2fa-enabled.png

  Scenario: 2FA required on login
    Tool: Playwright
    Preconditions: 2FA enabled for test user
    Steps:
      1. Navigate to /admin/login
      2. Enter correct email and password
      3. Verify redirected to 2FA verification page
      4. Enter valid TOTP code
      5. Verify successful login
    Expected Result: Login requires 2FA code
    Evidence: .sisyphus/evidence/task-8-2fa-login.png

  Scenario: Backup code recovery works
    Tool: Playwright
    Preconditions: 2FA enabled, backup codes saved
    Steps:
      1. Navigate to /admin/login
      2. Enter correct email and password
      3. Click "Use backup code"
      4. Enter one of the backup codes
      5. Verify successful login
      6. Verify that backup code is now invalidated
    Expected Result: Backup code allows login, then invalidated
    Evidence: .sisyphus/evidence/task-8-2fa-backup.png
  ```
  
  **Commit:** YES
  - Message: `feat: add TOTP two-factor authentication for admin accounts`
  - Files: Multiple files (see above)
  - Pre-commit: `npx prisma generate && npm run build`

---

### Wave 5: Enhanced Monitoring (Days 6-7)

> **Goal:** Comprehensive security logging and backup verification
> **Dependencies:** Tasks 5 and 6 complete

- [x] 9. Verify Backup Restoration Works

  **What to do:**
  - Create and test backup restoration procedure
  - Document step-by-step restore process
  - Perform trial restore to separate test database
  - Document recovery time objective (RTO)
  
  **Implementation:**
  - Create restore script
  - Test restore on development/staging environment
  - Document procedure in README
  - Schedule periodic restore tests
  
  **Files to create:**
  - `scripts/restore.sh` - Restore script
  - `docs/backup-restore-procedure.md` - Documentation (NEW)
  
  **Code change (restore script):**
  ```bash
  #!/bin/bash
  # scripts/restore.sh
  
  if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore.sh <backup_file.sql.gz>"
    exit 1
  fi
  
  BACKUP_FILE="$1"
  
  echo "WARNING: This will replace the current database!"
  read -p "Are you sure? (yes/no): " confirm
  
  if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
  fi
  
  echo "Restoring from $BACKUP_FILE..."
  gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"
  
  echo "Restore complete. Running Prisma migrations..."
  npx prisma migrate deploy
  
  echo "Database restored successfully."
  ```
  
  **Documentation:**
  ```markdown
  # Backup and Restore Procedure
  
  ## Backup
  
  - Backups run daily at 2 AM
  - Retained for 7 days
  - Stored in /var/backups/nedcloud/
  
  ## Restore
  
  1. Stop the application: `docker compose down`
  2. Find the backup file: `ls /var/backups/nedcloud/`
  3. Run restore: `./scripts/restore.sh /var/backups/nedcloud/nedcloud_YYYYMMDD_HHMMSS.sql.gz`
  4. Verify data: `npx prisma studio`
  5. Restart application: `docker compose up -d`
  
  ## Recovery Time Objective
  
  - Target: 30 minutes
  - Tested: [Date of last test]
  ```
  
  **Recommended Agent Profile:**
  - **Category:** `quick`
    - Reason: Script creation and documentation
  - **Skills:** None required
  
  **Parallelization:**
  - **Can Run In Parallel:** YES
  - **Parallel Group:** Wave 5 (with Task 10)
  - **Blocks:** None
  - **Blocked By:** Task 5 (backup system must exist)
  
  **References:**
  - `scripts/backup.sh` - Backup script (created in Task 5)
  - `docker-compose.yml` - Docker configuration
  
  **Acceptance Criteria:**
  - [ ] Restore script created and tested
  - [ ] Restore procedure documented
  - [ ] Test restore performed successfully
  - [ ] Recovery time measured and documented
  - [ ] Restore test schedule established
  
  **QA Scenarios:**
  ```
  Scenario: Backup can be restored
    Tool: Bash
    Preconditions: Backup file exists, test database available
    Steps:
      1. Create test database
      2. Run restore script with latest backup
      3. Verify tables exist in test database
      4. Verify data integrity (spot check)
    Expected Result: Database restored with all data
    Evidence: .sisyphus/evidence/task-9-restore-success.txt

  Scenario: Restore procedure is documented
    Tool: Manual review
    Preconditions: docs/backup-restore-procedure.md exists
    Steps:
      1. Read documentation
      2. Follow steps to restore
      3. Verify each step is clear and accurate
    Expected Result: Documentation is clear and complete
    Evidence: .sisyphus/evidence/task-9-restore-docs.md
  ```
  
  **Commit:** YES
  - Message: `docs: add backup restore procedure and test script`
  - Files: `scripts/restore.sh`, `docs/backup-restore-procedure.md`

- [x] 10. Enhance Security Logging (Comprehensive)

  **What to do:**
  - Expand security logging to include page visits, clicks, form submissions
  - Add structured logging with severity levels
  - Implement log aggregation for easier analysis
  - Add alerts for suspicious activity
  
  **Implementation:**
  - Extend security logger with comprehensive events
  - Add page visit tracking
  - Add form submission tracking
  - Add API request logging for admin endpoints
  - Create log analysis queries
  
  **Files to modify:**
  - `src/lib/security-logger.ts` - Expand logging capabilities
  - `src/middleware.ts` - Add page visit tracking
  - `src/app/api/*/route.ts` - Add API logging
  - `scripts/analyze-logs.ts` - Log analysis utility (NEW)
  
  **Code change (enhanced logger):**
  ```typescript
  // src/lib/security-logger.ts
  
  export type SecurityEventType = 
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'LOGOUT'
    | 'ADMIN_ACCESS'
    | 'ADMIN_PAGE_VISIT'
    | 'API_REQUEST'
    | 'API_ERROR'
    | 'FORM_SUBMISSION'
    | 'RATE_LIMIT_EXCEEDED'
    | 'SUSPICIOUS_REQUEST'
    | 'TWO_FACTOR_ENABLED'
    | 'TWO_FACTOR_DISABLED'
    | 'PASSWORD_CHANGED'
    | 'BACKUP_CREATED'
    | 'BACKUP_RESTORED'
  
  export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  
  export interface SecurityLogEntry {
    timestamp: string
    event: SecurityEventType
    severity: SeverityLevel
    ip: string
    userAgent: string
    userId?: string
    email?: string
    path?: string
    method?: string
    statusCode?: number
    duration?: number
    details?: Record<string, unknown>
  }
  
  // Severity mapping
  const EVENT_SEVERITY: Record<SecurityEventType, SeverityLevel> = {
    LOGIN_SUCCESS: 'LOW',
    LOGIN_FAILURE: 'MEDIUM',
    LOGOUT: 'LOW',
    ADMIN_ACCESS: 'MEDIUM',
    ADMIN_PAGE_VISIT: 'LOW',
    API_REQUEST: 'LOW',
    API_ERROR: 'MEDIUM',
    FORM_SUBMISSION: 'LOW',
    RATE_LIMIT_EXCEEDED: 'HIGH',
    SUSPICIOUS_REQUEST: 'CRITICAL',
    TWO_FACTOR_ENABLED: 'MEDIUM',
    TWO_FACTOR_DISABLED: 'MEDIUM',
    PASSWORD_CHANGED: 'MEDIUM',
    BACKUP_CREATED: 'LOW',
    BACKUP_RESTORED: 'HIGH',
  }
  
  export function logSecurityEvent(
    event: SecurityEventType,
    request: Request,
    details?: Record<string, unknown>
  ) {
    const severity = EVENT_SEVERITY[event]
    const entry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      event,
      severity,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      path: new URL(request.url).pathname,
      method: request.method,
      details,
    }
    
    // Log to file
    appendToLogFile(entry)
    
    // Log to console with severity coloring
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      console.error('[SECURITY]', JSON.stringify(entry))
    } else {
      console.log('[SECURITY]', JSON.stringify(entry))
    }
  }
  ```
  
  **Log analysis script:**
  ```typescript
  // scripts/analyze-logs.ts
  import fs from 'fs'
  
  const logFile = 'logs/security.log'
  const logs = fs.readFileSync(logFile, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line))
  
  // Count events by type
  const eventCounts = logs.reduce((acc, log) => {
    acc[log.event] = (acc[log.event] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Find failed logins
  const failedLogins = logs.filter(l => l.event === 'LOGIN_FAILURE')
  
  // Find suspicious activity
  const suspicious = logs.filter(l => l.severity === 'HIGH' || l.severity === 'CRITICAL')
  
  console.log('Event counts:', eventCounts)
  console.log('Failed logins (last 24h):', failedLogins.length)
  console.log('Suspicious events:', suspicious.length)
  ```
  
  **Recommended Agent Profile:**
  - **Category:** `quick`
    - Reason: Extending existing utility with more events
  - **Skills:** None required
  
  **Parallelization:**
  - **Can Run In Parallel:** YES
  - **Parallel Group:** Wave 5 (with Task 9)
  - **Blocks:** None
  - **Blocked By:** Task 6 (basic logging must exist)
  
  **References:**
  - `src/lib/security-logger.ts` - Existing security logger
  - `src/middleware.ts` - Middleware for tracking
  
  **Acceptance Criteria:**
  - [ ] Security logger tracks page visits
  - [ ] Security logger tracks form submissions
  - [ ] Security logger tracks API requests
  - [ ] Logs include severity levels
  - [ ] Log analysis script works
  - [ ] HIGH/CRITICAL events are highlighted
  
  **QA Scenarios:**
  ```
  Scenario: Page visits are logged
    Tool: Bash + curl
    Preconditions: Site is running, logging enabled
    Steps:
      1. Visit several admin pages
      2. Check logs/security.log for ADMIN_PAGE_VISIT entries
      3. Verify path and timestamp are recorded
    Expected Result: Page visit entries exist in log
    Evidence: .sisyphus/evidence/task-10-page-visits.txt

  Scenario: Form submissions are logged
    Tool: Bash + curl
    Preconditions: Site is running, logging enabled
    Steps:
      1. Submit contact form
      2. Check logs/security.log for FORM_SUBMISSION entry
      3. Verify form type is recorded
    Expected Result: Form submission entry exists in log
    Evidence: .sisyphus/evidence/task-10-form-submission.txt

  Scenario: High severity events are highlighted
    Tool: Bash
    Preconditions: Logs contain various severity levels
    Steps:
      1. Run scripts/analyze-logs.ts
      2. Check output includes severity breakdown
      3. Verify HIGH and CRITICAL events are listed
    Expected Result: Analysis shows severity distribution
    Evidence: .sisyphus/evidence/task-10-severity-analysis.txt
  ```
  
  **Commit:** YES
  - Message: `security: enhance logging with comprehensive events and severity levels`
  - Files: `src/lib/security-logger.ts`, `src/middleware.ts`, `scripts/analyze-logs.ts`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - Day 1, 4 parallel tasks):
├── Task 1: Remove X-Powered-By Header [quick]
├── Task 2: Add Noindex to Admin Pages [quick]
├── Task 3: Reduce Login Page Cache [quick]
└── Task 4: Verify Rate Limiting [quick]

Wave 2 (After Wave 1 - Days 2-3, 2 parallel tasks):
├── Task 5: Implement Backup System [unspecified-high]
└── Task 6: Basic Security Logging [quick]

Wave 3 (After Wave 2 - Days 4-5, 1 task):
└── Task 7: Strengthen CSP [deep]

Wave 4 (After Wave 3 - Days 5-7, 1 task):
└── Task 8: Add 2FA [deep]

Wave 5 (After Wave 4 - Days 6-7, 2 parallel tasks):
├── Task 9: Verify Backup Restoration [quick]
└── Task 10: Enhance Logging [quick]

Critical Path: Task 1-4 → Task 5-6 → Task 7 → Task 8 → Task 9-10
Total Estimated Time: 7 days
Parallel Speedup: ~30% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|------------|--------|------|
| 1-4 | — | 5-6 | 1 |
| 5 | — | 9 | 2 |
| 6 | — | 10 | 2 |
| 7 | 1-4 | 8 | 3 |
| 8 | 7 | 9-10 | 4 |
| 9 | 5 | — | 5 |
| 10 | 6 | — | 5 |

### Agent Dispatch Summary

| Wave | # Parallel | Tasks → Agent Category |
|------|------------|----------------------|
| 1 | **4** | T1-T4 → `quick` |
| 2 | **2** | T5 → `unspecified-high`, T6 → `quick` |
| 3 | **1** | T7 → `deep` |
| 4 | **1** | T8 → `deep` |
| 5 | **2** | T9-T10 → `quick` |

---

## Success Criteria

### Phase 1 Success Metrics

- [ ] SecurityHeaders.com grade: B+ or higher (currently B)
- [ ] X-Powered-By header removed
- [ ] Admin pages have noindex
- [ ] Login page cache reduced to 1 hour or less
- [ ] Automated backups running daily
- [ ] Security logs capturing failed logins

### Phase 2 Success Metrics

- [ ] SecurityHeaders.com grade: A or A+
- [ ] CSP does not contain `unsafe-inline` or `unsafe-eval`
- [ ] 2FA enabled for admin accounts
- [ ] Backup restore tested and documented
- [ ] Comprehensive security logging active

### Verification Commands

```bash
# Phase 1 Verification
curl -I "https://nedcloudsolutions.nl/" | grep -i "x-powered-by"
# Should return nothing (header removed)

curl -I "https://nedcloudsolutions.nl/admin/login" | grep -i "robots"
# Should return: X-Robots-Tag: noindex, nofollow

curl -I "https://nedcloudsolutions.nl/admin/login" | grep -i "cache-control"
# Should return: no-store or max-age <= 3600

# Phase 2 Verification
curl -I "https://nedcloudsolutions.nl/" | grep -i "content-security-policy"
# Should NOT contain "unsafe-inline" or "unsafe-eval"

# After enabling 2FA
curl "https://nedcloudsolutions.nl/admin/settings/2fa"
# Should return 200 (page exists)
```

---

## Communication Templates

### Email to Developer - Phase 1 Completion Request

```
Subject: Security Hardening Phase 1 - Implementation Request

Hi [Developer Name],

I've completed a security review with our consultant and identified 
several quick fixes that will significantly improve our security posture.

Could you implement Phase 1 this week? Here's what's needed:

1. Remove X-Powered-By header (5 minutes)
   - Add `poweredByHeader: false` to next.config.ts
   
2. Add noindex to admin pages (15 minutes)
   - Add X-Robots-Tag: noindex, nofollow header to /admin/* routes
   
3. Fix login page caching (10 minutes)
   - Reduce cache duration on /admin/login to 1 hour or less
   
4. Verify rate limiting (15 minutes)
   - Test that login is blocked after 10 failed attempts

CRITICAL: We also need automated database backups set up.
Currently we have NO backup system, which is a significant risk.

Please let me know if you have any questions. I've attached the 
full implementation plan with code examples.

Thanks,
[Your Name]
```

### Email to Developer - Phase 2 Implementation Request

```
Subject: Security Hardening Phase 2 - Next Steps

Hi [Developer Name],

Phase 1 looks great! Now let's tackle Phase 2.

Here's what I'd like to implement:

1. Content Security Policy strengthening (2-3 days)
   - Remove unsafe-inline and unsafe-eval from CSP
   - Add nonce support for scripts
   - This is complex, please test thoroughly

2. Two-Factor Authentication (2-3 days)
   - Implementation for admin accounts
   - Using TOTP (Google Authenticator compatible)
   - Need backup codes for account recovery

3. Enhanced security logging (1 day)
   - Comprehensive tracking of security events
   - Include severity levels
   - Create analysis queries

Before starting, I'd like to schedule a call to discuss:
- CSP approach and testing strategy
- 2FA user experience
- Logging priorities

Are you available for a 30-minute call this week?

Thanks,
[Your Name]
```

---

## Rollback Plan

If any task causes issues:

### Phase 1 Rollback

| Issue | Rollback Action |
|-------|-----------------|
| X-Powered-By removal breaks something | Re-add `poweredByHeader: true` in next.config.ts |
| Noindex breaks admin access | Remove X-Robots-Tag header from middleware |
| Cache fix causes login issues | Revert cache control headers |
| Backup script fails | Restore to previous backup manually |

### Phase 2 Rollback

| Issue | Rollback Action |
|-------|-----------------|
| CSP breaks site functionality | Revert to CSP with `unsafe-inline` temporarily |
| 2FA locks out admins | Use backup codes or disable 2FA in database |
| Logging impacts performance | Reduce logging level or disable comprehensive logging |

### Emergency Contacts

- **Developer:** [Developer Name] - [Email/Phone]
- **Hosting Provider:** [Provider Name] - [Support Number]
- **Security Consultant:** [Consultant Name] - [Email]

---

## Notes

- **This plan is designed for a developer to implement** - All tasks include code examples and clear acceptance criteria
- **Test in staging first** - Before deploying to production, test all changes in a staging environment
- **SecurityHeaders.com** - Run a scan before and after each phase to measure improvement
- **Backup before changes** - Always backup before making security changes

---

*Plan created: 2026-02-16*
*Last updated: 2026-02-16*
*Status: Ready for implementation*