# App Router Structure

**Purpose:** Next.js App Router implementation for routes, layouts, and API endpoints.

## STRUCTURE

```
src/app/
├── about/
│   └── page.tsx
├── admin/
│   ├── login/
│   │   └── page.tsx
│   ├── verify-2fa/         # Empty - needs implementation
│   └── (dashboard)/
│       ├── layout.tsx
│       ├── blog/
│       │   ├── [id]/page.tsx
│       │   └── page.tsx
│       ├── contacts/
│       │   └── page.tsx
│       ├── projects/       # Missing from docs - needs page.tsx
│       ├── services/       # Missing from docs - needs page.tsx
│       ├── settings/
│       │   └── page.tsx
│       ├── team/
│       │   └── page.tsx
│       └── testimonials/
│           └── page.tsx
├── api/
│   ├── 2fa/
│   │   ├── disable/route.ts
│   │   ├── login/route.ts
│   │   ├── setup/route.ts
│   │   ├── status/route.ts
│   │   └── verify/route.ts
│   ├── auth/
│   │   └── [...all]/route.ts
│   ├── blog/
│   │   ├── [id]/route.ts
│   │   └── route.ts
│   ├── contact/
│   │   ├── [id]/route.ts
│   │   └── route.ts
│   ├── health/
│   │   └── route.ts
│   ├── pages/              # Empty - needs implementation
│   ├── projects/
│   │   ├── [id]/route.ts
│   │   └── route.ts
│   ├── services/
│   │   ├── [id]/route.ts
│   │   └── route.ts
│   ├── team/
│   │   ├── [id]/route.ts
│   │   └── route.ts
│   ├── testimonials/
│   │   ├── [id]/route.ts
│   │   └── route.ts
│   └── user/
│       ├── password/route.ts
│       └── route.ts
├── blog/
│   └── page.tsx
│   # Note: [slug]/page.tsx for individual blog posts is planned but not implemented
├── contact/
│   └── page.tsx
├── globals.css
├── layout.tsx
├── not-found.tsx
├── privacy/
│   └── page.tsx
├── projects/
│   └── page.tsx
├── services/
│   ├── [slug]/page.tsx
│   └── page.tsx
├── terms/
│   └── page.tsx
├── globals.css
├── layout.tsx
└── not-found.tsx
```

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Add new public page | src/app/[page]/page.tsx |
| Admin blog editing | src/app/admin/(dashboard)/blog/page.tsx |
| 2FA verification flow | src/app/admin/verify-2fa/page.tsx |
| Contact form API | src/app/api/contact/route.ts |
| Projects listing page | src/app/projects/page.tsx |

## CONVENTIONS

- Route groups like (dashboard) protect directories without altering URLs
- Server Components used by default; add 'use client' only for client-side logic
- All API endpoints must exist in api/* paths as route.ts files
- Layout nesting creates protection boundaries: admin/layout.tsx covers all admin routes
- Dynamic routes use [slug]/page.tsx for parameterized navigation

## ANTI-PATTERNS

- API routes outside api/ directory break REST conventions
- Client components without 'use client' cause hydration errors
- Hardcoding API URLs instead of using environment variables
- Duplicate layout structures; use existing route groups like (dashboard)
