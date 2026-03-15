# API Routes

**Purpose:** REST API endpoints for CMS operations with authentication.

## STRUCTURE

```
src/app/api/
├── 2fa/
│   ├── disable/route.ts
│   ├── login/route.ts
│   ├── setup/route.ts
│   ├── status/route.ts
│   └── verify/route.ts
├── auth/
│   └── [...all]/route.ts
├── blog/
│   └── [id]/route.ts
├── contact/
│   ├── [id]/route.ts
│   └── route.ts
├── health/
│   └── route.ts
├── pages/
│   └── route.ts
├── projects/
│   └── [id]/route.ts
├── services/
│   └── [id]/route.ts
├── team/
│   └── [id]/route.ts
├── testimonials/
│   └── [id]/route.ts
└── user/
    ├── password/route.ts
    └── route.ts
```

## WHERE TO LOOK

| Endpoint | Purpose |
|----------|---------|
| POST /api/services | Create service |
| PUT /api/services/[id] | Update service |
| DELETE /api/services/[id] | Delete service |
| GET /api/services?all=true | All services (admin) |
| POST /api/2fa/setup | Generate TOTP secret |
| POST /api/2fa/verify | Enable 2FA |
| POST /api/2fa/login | Verify 2FA code |

## CONVENTIONS

- GET ?all=true returns all records (admin), otherwise filtered by published/approved
- POST creates, PUT with [id] updates, DELETE removes
- All mutation routes require session?.user
- 2FA endpoints: setup, verify, disable, status, login
- Rate limiting: API 100/min, Auth 10/min per IP

## ANTI-PATTERNS

- Never bypass authentication on mutation routes
- Don't return sensitive data in GET responses
- Avoid custom HTTP methods; use standard REST
- Never log secrets or tokens