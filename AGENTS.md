# NEDCLOUD WEBSITE KNOWLEDGE BASE

**Generated:** 2026-02-15
**Updated:** 2026-02-17
**Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v3.4, Prisma 6, PostgreSQL, NextAuth v5

## OVERVIEW

Full-stack marketing website + CMS for Nedcloud Solutions (Agentic AI & Infrastructure consulting). Dark futuristic theme with neon accents.

## STRUCTURE

```
src/
├── app/                    # App Router (pages, layouts, API routes)
│   ├── admin/(dashboard)/  # Protected admin area with route groups
│   ├── admin/login/        # Login page with 2FA support
│   └── api/                # REST endpoints (CRUD for all content types)
│       ├── 2fa/            # Two-factor authentication endpoints
│       ├── auth/[...all]/  # NextAuth handlers
│       ├── blog/           # Blog CRUD
│       ├── contact/        # Contact form submissions
│       ├── projects/       # Projects CRUD
│       ├── services/       # Services CRUD
│       ├── team/           # Team members CRUD
│       ├── testimonials/   # Testimonials CRUD
│       └── user/           # User profile & password
├── components/
│   ├── admin/              # CRUD managers for CMS (modal pattern)
│   ├── layout/             # Header, Footer
│   ├── sections/           # Homepage sections (Hero, Services, Projects...)
│   └── ui/                 # Reusable: Button, Input, Card
├── lib/
│   ├── auth.ts             # NextAuth v5 config (trustHost: true required)
│   ├── prisma.ts           # Prisma client singleton
│   ├── sanitize.ts         # DOMPurify HTML sanitization
│   ├── security-logger.ts  # Security event logging with severity levels
│   ├── rateLimit.ts        # Rate limiting middleware
│   ├── security.config.ts  # Central security configuration
│   ├── totp.ts             # TOTP utilities for 2FA
│   ├── utils.ts            # Utility functions (cn, etc.)
│   └── validations.ts      # Zod input validation schemas
└── types/                  # TypeScript declarations
prisma/
├── schema.prisma           # Models: User, Service, Project, Post, Testimonial, TeamMember, ContactSubmission, SiteSettings, Page
└── seed.ts                 # Initial data + admin user
scripts/
├── backup.sh               # Automated database backup (7-day retention)
├── restore.sh              # Database restoration script
└── analyze-logs.ts         # Security log analysis utility
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add/edit page | `src/app/[page]/page.tsx` |
| Add admin CRUD | `src/components/admin/[Name]Manager.tsx` + `src/app/api/[resource]/route.ts` |
| Modify auth | `src/lib/auth.ts` |
| Database schema | `prisma/schema.prisma` |
| Tailwind theme | `tailwind.config.ts` (custom dark colors, neon palette) |
| API endpoint | `src/app/api/[resource]/[id?]/route.ts` |

## CONVENTIONS

- **Path alias**: `@/*` maps to `./src/*`
- **Server Components** by default; `'use client'` directive for interactive components
- **Route groups**: `(dashboard)` for admin layout without affecting URL
- **API patterns**: 
  - GET with `?all=true` returns all records (admin), otherwise filtered
  - POST creates, PUT with `[id]` updates, DELETE removes
- **Auto-author**: New posts/projects default to first ADMIN user

## ANTI-PATTERNS

- **`as any`**, **`@ts-ignore`**, **`@ts-expect-error`** - Never
- **Hardcoded credentials** - Use `.env.local` (gitignored)
- **Empty catch blocks** - Never
- **Comments** - Code should be self-documenting

## SECURITY

### Authentication & Authorization
- **NextAuth v5** with credentials provider (bcryptjs password hashing)
- **Two-Factor Authentication (2FA)**: TOTP-based (Google Authenticator, Authy compatible)
- **Middleware protection**: `src/middleware.ts` protects all `/admin/*` routes
- **API authentication**: All mutation routes (POST, PUT, DELETE) require valid session
- **Session strategy**: JWT with role-based access (ADMIN, EDITOR)

### Protected Resources
| Resource | Protection |
|----------|------------|
| `/admin/*` pages | Middleware redirects to login if unauthenticated |
| `/api/*/POST` | Requires `session?.user` |
| `/api/*/PUT` | Requires `session?.user` |
| `/api/*/DELETE` | Requires `session?.user` |
| `/api/user/*` | Requires `session?.user` |
| `/api/2fa/*` | Requires `session?.user` |

### Two-Factor Authentication (2FA)
| Endpoint | Purpose |
|----------|---------|
| `/api/2fa/setup` | Generate TOTP secret + QR code |
| `/api/2fa/verify` | Verify setup code and enable 2FA |
| `/api/2fa/disable` | Disable 2FA (requires verification) |
| `/api/2fa/status` | Check if 2FA is enabled |
| `/api/2fa/login` | Verify 2FA during login flow |

**2FA Flow:**
1. User enables 2FA in `/admin/settings` → scans QR code with authenticator app
2. On login: credential check → if 2FA enabled, redirect to verification screen
3. User enters 6-digit code from authenticator → session established
4. Backup codes available for account recovery (8 codes, single-use)

### XSS Prevention
- **DOMPurify** via `isomorphic-dompurify` sanitizes all HTML content
- **Usage**: `sanitizeHtml(content)` from `@/lib/sanitize`
- **Applied to**: Service content, blog posts, any user-rendered HTML

### Security Logging
- **Location**: `src/lib/security-logger.ts`
- **Log file**: `logs/security.log`
- **Events tracked**: Login attempts, API requests, form submissions
- **Severity levels**: LOW, MEDIUM, HIGH, CRITICAL
- **Analysis**: `npx ts-node scripts/analyze-logs.ts`

### Backup & Recovery
- **Backup script**: `scripts/backup.sh` (automated, 7-day retention)
- **Restore script**: `scripts/restore.sh`
- **Documentation**: `docs/backup-restore-procedure.md`

### Environment Variables
- `.env.local` contains: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- Never commit `.env.local` - already in `.gitignore`
- Generate secrets: `openssl rand -base64 32`

### Security Checklist for Production
1. [ ] Change `NEXTAUTH_SECRET` from dev value
2. [ ] Update `NEXTAUTH_URL` to production domain
3. [ ] Set strong `ADMIN_PASSWORD`
4. [ ] Enable 2FA for all admin accounts
5. [ ] Configure reverse proxy with `X-Forwarded-*` headers
6. [ ] Enable HTTPS
7. [ ] Verify backup automation is running
8. [ ] Review security logs periodically

### Additional Security Features

**Security Config** (`src/lib/security.config.ts`):
- Central place to change all security values
- Edit this file to adjust: rate limits, validation limits, HSTS settings

**Rate Limiting** (`src/lib/rateLimit.ts`):
- API routes: 100 requests/minute/IP
- Auth routes: 10 requests/minute/IP
- Returns 429 with `Retry-After` header

**Input Validation** (`src/lib/validations.ts`):
- Zod schemas for all API inputs
- Usage: `validate(schema, body)` → `{ success, data/errors }`

**Security Headers** (`next.config.ts`):
- Content-Security-Policy (no unsafe-eval)
- HSTS, X-Frame-Options, X-Content-Type-Options
- Referrer-Policy, Permissions-Policy
- X-Powered-By header removed

## COMMANDS

```bash
npm run dev              # Development server (localhost:3000)
npm run build            # Production build (includes prisma generate)
docker compose up -d     # Production deployment
docker compose -f docker-compose.dev.yml up -d  # Dev database only
npx prisma studio        # Database GUI at localhost:5555
```

## NOTES

- Prisma 6 used (v7 has breaking changes)
- `trustHost: true` required in `auth.ts` for Docker/reverse proxy
- Alpine Linux containers need `binaryTargets: ["linux-musl-openssl-3.0.x"]` in schema
- Service slugs: `agentic-ai`, `infrastructure`, `cloud`, `fullstack`