# Nedcloud Solutions Website

A modern, full-stack website for Nedcloud Solutions — Agentic AI & Infrastructure Consulting.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 6 |
| Styling | Tailwind CSS v4 (custom dark theme via `@theme`) |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 (driver adapter) |
| Authentication | NextAuth.js v5 |
| Animations | Framer Motion |
| Deployment | Docker (multi-stage build) |

## Features

- Dark theme with cyan/blue neon accents
- Responsive design (mobile-first)
- CMS for content management (services, projects, blog, testimonials, team)
- Contact form with submission tracking
- Admin dashboard with authentication
- Two-Factor Authentication (2FA) with TOTP
- Docker deployment ready
- Security: NextAuth v5, 2FA, rate limiting, Zod validation, DOMPurify XSS prevention, security headers

---

## Development Setup

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | JavaScript runtime |
| npm | 10+ | Package manager |
| Docker | 24+ | Container runtime (for PostgreSQL) |
| Docker Compose | 2+ | Multi-container orchestration |

### Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/NedCloud/nedcloud-website.git
   cd nedcloud-website
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` — see the file for documentation of all variables and deployment notes.

   Generate secrets:
   ```bash
   openssl rand -base64 32   # NEXTAUTH_SECRET
   openssl rand -base64 16   # DB_PASSWORD, ADMIN_PASSWORD
   ```

3. **Start PostgreSQL:**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

4. **Initialize the database:**
   ```bash
   npm run prisma:migrate   # Migrations (recommended)
   # or
   npm run db:push          # Push schema directly (no migration files)
   ```

5. **Seed initial data:**
   ```bash
   npm run prisma:seed
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

   Open http://localhost:3000

---

## Access Points

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Public website |
| http://localhost:3000/admin/login | Admin dashboard |
| http://localhost:3000/api | API endpoints |

---

## Available Scripts

```bash
npm run dev              # Start dev server
npm run build            # Production build (runs prisma generate first)
npm run start            # Start production server
npm run lint             # Run ESLint

npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio GUI
npm run prisma:seed      # Seed database
npm run db:push          # Push schema changes (no migrations)
```

### Docker

```bash
# Development
docker compose -f docker-compose.dev.yml up -d      # Start database
docker compose -f docker-compose.dev.yml down       # Stop database

# Production
docker compose --profile migrate run --rm migrate   # Run migrations (one-off)
docker compose up -d                                # Build and start
docker compose down                                 # Stop
```

---

## Project Structure

```
src/
├── app/                    # App Router (pages, layouts, API routes)
│   ├── admin/(dashboard)/  # Protected admin area
│   ├── admin/login/         # Login page with 2FA
│   ├── api/                 # REST endpoints
│   │   ├── 2fa/             # 2FA setup/verify/disable/login/status
│   │   ├── auth/[...all]/   # NextAuth handlers
│   │   ├── blog/[id]/       # Blog CRUD
│   │   ├── contact/[id]/    # Contact submissions CRUD
│   │   ├── health/          # Health check
│   │   ├── projects/[id]/   # Projects CRUD
│   │   ├── services/[id]/   # Services CRUD
│   │   ├── team/[id]/       # Team CRUD
│   │   ├── testimonials/[id]/ # Testimonials CRUD
│   │   └── user/            # User profile & password
│   └── services/[slug]/    # Service detail page
├── components/
│   ├── admin/               # CRUD managers for CMS
│   ├── layout/              # Header, Footer
│   ├── sections/            # Homepage sections (Hero, Services, Projects...)
│   └── ui/                  # Button, Card, Input, BrandIcons
├── lib/
│   ├── auth.ts              # NextAuth v5 config
│   ├── prisma.ts            # Prisma client singleton (driver adapter)
│   ├── sanitize.ts          # DOMPurify HTML sanitization
│   ├── security-logger.ts   # Security event logging
│   ├── rateLimit.ts         # Rate limiting middleware
│   ├── security.config.ts   # Central security configuration
│   ├── totp.ts              # TOTP utilities for 2FA
│   ├── utils.ts             # Utility functions (cn, etc.)
│   └── validations.ts       # Zod input validation schemas
├── proxy.ts                 # Middleware for admin route protection
└── types/                   # TypeScript declarations

prisma/
├── schema.prisma           # Database models
├── seed.ts                 # Seed data
└── migrations/             # Migration history

prisma.config.ts            # Prisma v7 configuration
postcss.config.mjs          # PostCSS (Tailwind v4 plugin)
next.config.ts              # Next.js configuration
Dockerfile                  # Multi-stage production build
docker-compose.yml          # Production deployment
docker-compose.dev.yml      # Development database
```

---

## Environment Variables

See `.env.local.example` for full documentation.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DB_USER` | Yes | Database user (used by Docker Compose) |
| `DB_PASSWORD` | Yes | Database password |
| `DB_NAME` | Yes | Database name |
| `DB_PORT` | No | Database port (default: 5432) |
| `NEXTAUTH_SECRET` | Yes | JWT encryption secret |
| `NEXTAUTH_URL` | Yes | Application base URL |
| `ADMIN_EMAIL` | Seeding | Admin email for initial seed |
| `ADMIN_PASSWORD` | Seeding | Admin password for initial seed |
| `APP_PORT` | No | App port override (default: 3000) |
| `STUDIO_PORT` | No | Prisma Studio port (default: 5555) |

**Note:** For Docker Compose, change `DATABASE_URL` host from `localhost` to `postgres`.

---

## Security

### Authentication

- NextAuth v5 with credentials provider
- Passwords hashed with bcrypt (12 rounds)
- JWT sessions with role-based access (ADMIN/EDITOR)
- Middleware protection for all `/admin/*` routes

### Two-Factor Authentication (2FA)

TOTP-based 2FA for admin accounts (Google Authenticator, Authy, 1Password compatible).

| Endpoint | Purpose |
|----------|---------|
| `/api/2fa/setup` | Generate TOTP secret and QR code |
| `/api/2fa/verify` | Verify setup code and enable 2FA |
| `/api/2fa/disable` | Disable 2FA (requires verification) |
| `/api/2fa/status` | Check if 2FA is enabled |
| `/api/2fa/login` | Verify 2FA during login flow |

### Rate Limiting

Configured in `src/lib/security.config.ts`:

| Route Type | Limit | Window |
|------------|-------|--------|
| API routes | 100 requests | 60 seconds |
| Auth routes | 10 requests | 60 seconds |

### Other Security Measures

- **Input validation**: Zod schemas for all API inputs (`src/lib/validations.ts`)
- **XSS prevention**: DOMPurify sanitizes all HTML content
- **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options (via `next.config.ts`)
- **Security logging**: Events logged to `logs/security.log` with severity levels
- **Backup**: Automated database backups with 7-day retention (`scripts/backup.sh`)

---

## Database Schema

| Model | Description |
|-------|-------------|
| `User` | Admin users with role (ADMIN/EDITOR) and 2FA fields |
| `Service` | Services offered (Agentic AI, Infrastructure, Cloud, Full-Stack) |
| `Project` | Portfolio projects with technologies |
| `Post` | Blog posts with tags and author |
| `Testimonial` | Client testimonials with approval workflow |
| `TeamMember` | Team members with social links |
| `ContactSubmission` | Contact form submissions |
| `SiteSettings` | Site-wide configuration |
| `Page` | CMS pages with SEO metadata |
| `VerificationToken` | NextAuth tokens |

---

## Production Deployment

### Docker Compose

```bash
docker compose --profile migrate run --rm migrate   # Run migrations (one-off)
docker compose up -d                                 # Start services
docker compose logs -f                               # View logs
docker compose down                                  # Stop
```

### Manual

```bash
DATABASE_URL="your-production-url" \
NEXTAUTH_SECRET="your-production-secret" \
NEXTAUTH_URL="https://yourdomain.com" \
npm run build && npm run start
```

### Production Checklist

- Change `NEXTAUTH_URL` to production URL
- Generate new `NEXTAUTH_SECRET`
- Use production PostgreSQL database
- Set strong admin password
- Enable 2FA for all admin accounts
- Configure reverse proxy with `X-Forwarded-*` headers
- Enable HTTPS
- Verify backup automation (`scripts/backup.sh`)
- Review security logs periodically

---

## Troubleshooting

```bash
# Database not connecting
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs postgres

# Prisma client errors
npm run prisma:generate

# Build errors
rm -rf .next && npm run build

# Port 3000 in use
lsof -i :3000
kill -9 <PID>
```

---

## License

MIT License — See [LICENSE.md](LICENSE.md) for details.