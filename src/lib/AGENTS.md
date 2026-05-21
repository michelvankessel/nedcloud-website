# Security & Utilities Library

**Generated:** 2026-05-21T21:52:33Z
**Commit:** bf783fb
**Purpose:** Centralized security, authentication, validation, and utility modules.

## Modules

| File | Purpose | Key Exports |
|------|---------|-------------|
| `auth.ts` | NextAuth v5 config with credentials + 2FA | `handlers`, `signIn`, `signOut`, `auth` |
| `prisma.ts` | Prisma client singleton | `prisma` |
| `totp.ts` | TOTP 2FA utilities | `generateTOTPSecret`, `verifyTOTP`, `generateQRCodeDataURL` |
| `security-logger.ts` | Security event logging | `logLoginAttempt`, `logAPIRequest`, `logFormSubmission` |
| `validations.ts` | Zod input schemas | `validate()`, `serviceSchema`, `projectSchema`, etc. |
| `rateLimit.ts` | Rate limiting middleware | `rateLimit(type)` |
| `sanitize.ts` | XSS prevention | `sanitizeHtml()`, `sanitizePlainText()` |
| `security.config.ts` | Centralized security values | `securityConfig` |
| `utils.ts` | General utilities | `cn()`, `formatDate()`, `slugify()` |

## Integration

```
Request → middleware.ts → rateLimit.ts → auth.ts → validations.ts → route.ts
                                    ↓
                          security-logger.ts
```

## Conventions

- **Always** use `validate(schema, body)` for API inputs
- **Always** use `sanitizeHtml()` for user-rendered HTML
- **Never** bypass rate limiting for auth routes
- **Never** log secrets or tokens

## Security Config

Edit `security.config.ts` to adjust:
- Rate limits: API 100/min, Auth 10/min
- Password: min 8 chars, 12 hash rounds
- HSTS: max-age 31536000