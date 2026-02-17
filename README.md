# Nedcloud Solutions Website

A modern, full-stack website for Nedcloud Solutions - Agentic AI & Infrastructure Consulting.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3.4 (custom dark theme) |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Authentication | NextAuth.js v5 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Deployment | Docker (multi-stage build) |

## Features

- Modern dark theme with cyan/blue neon accents
- Responsive design (mobile-first)
- CMS for content management (services, projects, blog, testimonials, team)
- Contact form with submission tracking
- Admin dashboard with authentication
- Two-Factor Authentication (2FA) with TOTP
- Docker deployment ready
- **Security features:**
  - NextAuth v5 authentication with bcrypt password hashing
  - Two-Factor Authentication (TOTP-based)
  - Rate limiting (100 API/10 auth requests per minute per IP)
  - Input validation with Zod schemas
  - XSS prevention with DOMPurify
  - Security headers (CSP, HSTS, X-Frame-Options, etc.)
  - Centralized security configuration
  - Comprehensive security logging
  - Automated database backups

---

## Development Setup

### Prerequisites

Ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | JavaScript runtime |
| npm | 10+ | Package manager |
| Docker | 24+ | Container runtime (for PostgreSQL) |
| Docker Compose | 2+ | Multi-container orchestration |

<details>
<summary>Installing Prerequisites</summary>

**Ubuntu/Debian:**
```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

**macOS:**
```bash
# Homebrew
brew install node@20 docker docker-compose
```

**Windows:**
- [Node.js installer](https://nodejs.org/en/download/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
</details>

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/NedCloud/nedcloud-website.git
   cd nedcloud-website
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your values:
   ```env
   # Database
   DATABASE_URL="postgresql://nedcloud:YOUR_DB_PASSWORD@localhost:5432/nedcloud"
   DB_PASSWORD="YOUR_DB_PASSWORD"
   
   # NextAuth
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Admin (for seeding)
   ADMIN_EMAIL="admin@nedcloudsolutions.nl"
   ADMIN_PASSWORD="YOUR_ADMIN_PASSWORD"
   ```
   
   Generate secrets:
   ```bash
   # For NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # For DB_PASSWORD and ADMIN_PASSWORD
   openssl rand -base64 16
   ```

4. **Start PostgreSQL database:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```
   
   This starts a PostgreSQL container. Credentials are read from your `.env.local` file.

5. **Initialize the database:**
   
   **Option A: Migrations (recommended)**
   ```bash
   npm run prisma:migrate
   ```
   Creates tables and saves migration history in `prisma/migrations/`.
   
   **Option B: Push (quick prototyping)**
   ```bash
   npm run db:push
   ```
   Syncs schema directly to database without migration files.

6. **Seed initial data:**
   ```bash
   npm run prisma:seed
   ```
   Creates:
   - Admin user (email/password from ADMIN_EMAIL/ADMIN_PASSWORD env vars)
   - Default services (Agentic AI, Infrastructure, Cloud, Full-Stack)
   - Sample testimonial
   - Site settings

7. **Start the development server:**
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

### Admin Credentials

Set your admin credentials in `.env.local` before seeding:
```
ADMIN_EMAIL="admin@nedcloudsolutions.nl"
ADMIN_PASSWORD="your-secure-password"
```

---

## Available Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations (creates tables)
npm run prisma:studio    # Open Prisma Studio GUI (http://localhost:5555)
npm run prisma:seed      # Seed database with initial data
npm run db:push          # Push schema changes (no migrations)

# Docker
docker-compose -f docker-compose.dev.yml up -d    # Start dev database
docker-compose -f docker-compose.dev.yml down     # Stop dev database
docker-compose up -d                               # Production deployment
docker-compose down                                # Stop production
```

---

## Project Structure

```
nedcloud-website/
├── src/
│   ├── app/
│   │   ├── page.tsx                # Homepage
│   │   ├── about/                  # About page
│   │   ├── services/               # Services page + [slug] detail
│   │   ├── projects/               # Projects page
│   │   ├── blog/                   # Blog page
│   │   ├── contact/                # Contact page
│   │   ├── privacy/                # Privacy policy
│   │   ├── terms/                  # Terms of service
│   │   ├── admin/
│   │   │   ├── login/              # Admin login
│   │   │   └── (dashboard)/        # Protected admin routes
│   │   │       ├── page.tsx        # Dashboard overview
│   │   │       ├── services/       # Manage services
│   │   │       ├── projects/       # Manage projects
│   │   │   ├── blog/           # Manage blog
│   │   │   ├── testimonials/   # Manage testimonials
│   │   │   ├── team/           # Manage team
│   │   │   ├── contacts/       # View submissions
│   │   │   └── settings/       # Admin settings (password change)
│   │   ├── api/
│   │   │   ├── auth/[...all]/      # NextAuth endpoints
│   │   │   ├── services/           # Services CRUD
│   │   │   ├── projects/           # Projects CRUD
│   │   │   ├── blog/               # Blog CRUD
│   │   │   ├── testimonials/       # Testimonials CRUD
│   │   │   └── team/               # Team CRUD
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css             # Global styles
│   │   └── not-found.tsx           # 404 page
│   ├── components/
│   │   ├── ui/                     # Button, Card, Input
│   │   ├── layout/                 # Header, Footer
│   │   ├── sections/               # Hero, Services, Projects, etc.
│   │   ├── admin/                  # Admin components
│   ├── lib/
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── auth.ts                 # NextAuth configuration
│   │   ├── utils.ts                # Utility functions (cn, etc.)
│   │   ├── sanitize.ts             # DOMPurify HTML sanitization
│   │   ├── rateLimit.ts            # Rate limiting middleware
│   │   ├── security.config.ts      # Central security configuration
│   │   └── validations.ts          # Zod validation schemas
│   ├── middleware.ts               # Auth middleware for admin routes
│   └── types/                      # TypeScript declarations
├── prisma/
│   ├── schema.prisma               # Database models
│   ├── seed.ts                     # Seed data
│   └── migrations/                 # Migration files
├── public/                         # Static assets
├── Dockerfile                      # Multi-stage Docker build
├── docker-compose.yml              # Production deployment
├── docker-compose.dev.yml          # Development database
├── tailwind.config.ts              # Tailwind configuration
├── next.config.ts                  # Next.js configuration
└── package.json                    # Dependencies & scripts
```

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Yes | Secret for JWT encryption | 32+ random characters |
| `NEXTAUTH_URL` | Yes | Base URL of your application | `http://localhost:3000` |
| `ADMIN_EMAIL` | Yes* | Admin email for seeding | `admin@nedcloudsolutions.nl` |
| `ADMIN_PASSWORD` | Yes* | Admin password for seeding | Secure password |

*Required for initial seeding only. Can be removed after first seed.

---

## Security

### Authentication & Authorization

- **NextAuth v5** with credentials provider
- Passwords hashed with bcrypt (12 rounds by default)
- JWT-based sessions with role-based access (ADMIN/EDITOR)
- Middleware protection for all `/admin/*` routes

### Two-Factor Authentication (2FA)

TOTP-based two-factor authentication is available for admin accounts:

- **Compatible apps**: Google Authenticator, Authy, 1Password
- **Setup**: Navigate to `/admin/settings` → Enable 2FA → Scan QR code
- **Backup codes**: 8 single-use codes generated on setup for account recovery
- **Flow**: After password login, users with 2FA enabled must enter a 6-digit code

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

### Input Validation

All API inputs validated with Zod schemas in `src/lib/validations.ts`:
- Services, projects, blog posts, testimonials, team members
- Password minimum length: 8 characters
- Title max: 200 characters, content max: 100,000 characters

### XSS Prevention

- DOMPurify sanitizes all HTML content
- Use `sanitizeHtml(content)` from `@/lib/sanitize`

### Security Logging

All security events are logged to `logs/security.log`:

| Event Type | Severity |
|------------|----------|
| Login success/failure | LOW/HIGH |
| API requests | MEDIUM |
| Form submissions | MEDIUM |
| Rate limit exceeded | HIGH |
| Suspicious requests | CRITICAL |

Analyze logs: `npx ts-node scripts/analyze-logs.ts`

### Backup & Recovery

Automated database backups with 7-day retention:

```bash
# Create backup
./scripts/backup.sh

# Restore from backup
./scripts/restore.sh /backups/nedcloud_20260217_120000.sql.gz
```

See `docs/backup-restore-procedure.md` for detailed instructions.

### Security Headers

Automatically applied via `next.config.ts`:
- Content-Security-Policy (no unsafe-eval)
- Strict-Transport-Security (HSTS)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin
- Permissions-Policy: camera/microphone/geolocation disabled
- X-Powered-By header removed

### Centralized Configuration

All security values can be changed in one file:

```typescript
// src/lib/security.config.ts
export const securityConfig = {
  rateLimit: {
    windowMs: 60 * 1000,
    apiMaxRequests: 100,
    authMaxRequests: 10,
  },
  validation: {
    passwordMinLength: 8,
    titleMaxLength: 200,
    // ... more settings
  },
  session: {
    passwordHashRounds: 12,
  },
}
```

---

## Database Schema

| Model | Description |
|-------|-------------|
| `User` | Admin users with role (ADMIN/EDITOR) |
| `Service` | Services offered (Agentic AI, Infrastructure, etc.) |
| `Project` | Portfolio projects with technologies |
| `Post` | Blog posts with tags and author |
| `Testimonial` | Client testimonials with approval workflow |
| `TeamMember` | Team members with social links |
| `ContactSubmission` | Contact form submissions |
| `SiteSettings` | Site-wide configuration |

---

## Production Deployment

### Docker Compose (recommended)

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Manual Deployment

```bash
# Build
npm run build

# Start with environment
DATABASE_URL="your-production-url" \
NEXTAUTH_SECRET="your-production-secret" \
NEXTAUTH_URL="https://yourdomain.com" \
npm run start
```

### Environment Checklist

- [ ] Change `NEXTAUTH_URL` to production URL
- [ ] Generate new `NEXTAUTH_SECRET` (don't reuse dev secret)
- [ ] Use production PostgreSQL database
- [ ] Change admin password
- [ ] Set up SSL/HTTPS
- [ ] Configure email for contact form (optional)

---

## Troubleshooting

### Database Connection Error

```bash
# Check if database is running
docker-compose -f docker-compose.dev.yml ps

# View database logs
docker-compose -f docker-compose.dev.yml logs postgres

# Restart database
docker-compose -f docker-compose.dev.yml restart postgres
```

### Prisma Client Error

```bash
# Regenerate Prisma client
npm run prisma:generate
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

---

## License

MIT License - See [LICENSE.md](LICENSE.md) for details.
