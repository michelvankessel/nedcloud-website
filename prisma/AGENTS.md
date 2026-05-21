# Prisma Database

**Generated:** 2026-05-21T21:52:33Z
**Commit:** bf783fb
**Purpose:** Database schema and seeding for PostgreSQL.

## STRUCTURE

```
prisma/
├── schema.prisma    # Database models
├── seed.ts          # Initial data + admin user
└── migrations/        # Migration history
```

## WHERE TO LOOK

| Task | Command/File |
|------|--------------|
| Update schema | schema.prisma |
| Apply migrations | npm run prisma:migrate |
| Quick schema sync | npm run db:push |
| Seed database | npm run prisma:seed |
| View data | npx prisma studio |

## CONVENTIONS

- Models: User, Service, Project, Post, Testimonial, TeamMember, ContactSubmission, SiteSettings, Page
- User roles: ADMIN, EDITOR
- Service slugs: agentic-ai, infrastructure, cloud, fullstack
- Auto-author: New posts/projects default to first ADMIN user
- Binary targets: linux-musl-openssl-3.0.x for Alpine Linux

## ANTI-PATTERNS

- Never modify migrations after commit; create new migration instead
- Don't skip migrations in production; always use prisma:migrate
- Avoid direct SQL when Prisma client can handle it
- Never commit .env files with database credentials