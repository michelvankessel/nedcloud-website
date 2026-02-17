# Two-Factor Authentication (2FA) Implementation

This document describes the TOTP-based two-factor authentication system implemented for the Nedcloud Solutions admin panel.

## Overview

The 2FA system uses Time-based One-Time Passwords (TOTP), compatible with popular authenticator apps:

- Google Authenticator
- Authy
- 1Password
- Microsoft Authenticator
- Any TOTP-compatible app

## Architecture

### Database Schema

The `User` model includes 2FA fields:

```prisma
model User {
  // ... other fields
  twoFactorEnabled    Boolean   @default(false)
  twoFactorSecret     String?   // Encrypted TOTP secret
  twoFactorBackupCodes String[] // Hashed backup codes
  twoFactorVerifiedAt DateTime? // When 2FA was enabled
}
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| TOTP Utilities | `src/lib/totp.ts` | Secret generation, verification, QR codes |
| 2FA API Routes | `src/app/api/2fa/` | Setup, verify, disable, login endpoints |
| Settings UI | `src/components/admin/SettingsManager.tsx` | Enable/disable 2FA interface |
| Login Flow | `src/app/admin/login/page.tsx` | 2FA verification during login |
| Auth Provider | `src/lib/auth.ts` | Credentials provider with 2FA check |

## User Flow

### Enabling 2FA

1. Navigate to `/admin/settings`
2. Click "Enable 2FA" button
3. Scan QR code with authenticator app
4. Enter 6-digit verification code
5. Receive and save backup codes

### Login with 2FA

1. Enter email and password
2. If 2FA is enabled, redirected to verification screen
3. Enter 6-digit code from authenticator app
4. Access granted on successful verification

### Using Backup Codes

1. During login, after password verification
2. Enter one of the saved backup codes instead of TOTP
3. Code is invalidated after use
4. Remaining backup codes still valid

## API Endpoints

### POST `/api/2fa/setup`

Generate TOTP secret and QR code for setup.

**Authentication:** Required (session)

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "encryptedSecret": "abc123...",
  "qrCode": "data:image/png;base64,..."
}
```

### POST `/api/2fa/verify`

Verify setup code and enable 2FA.

**Authentication:** Required (session)

**Request:**
```json
{
  "token": "123456",
  "encryptedSecret": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "backupCodes": ["A1B2C3D4", "E5F6G7H8", ...]
}
```

### GET `/api/2fa/status`

Check if 2FA is enabled for current user.

**Authentication:** Required (session)

**Response:**
```json
{
  "enabled": true,
  "verifiedAt": "2026-02-17T10:00:00.000Z"
}
```

### POST `/api/2fa/disable`

Disable 2FA for current user.

**Authentication:** Required (session)

**Request:**
```json
{
  "token": "123456"
}
```

**Response:**
```json
{
  "success": true
}
```

### POST `/api/2fa/login`

Verify 2FA token during login flow.

**Authentication:** Not required (login flow)

**Request:**
```json
{
  "email": "admin@example.com",
  "token": "123456"
}
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "clk123...",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

## Security Considerations

### Secret Storage

TOTP secrets are encrypted before storage using AES-256-CBC:
- Encryption key derived from `NEXTAUTH_SECRET`
- Unique IV for each secret
- Secrets never logged or exposed after initial setup

### Backup Codes

- 8 codes generated on setup
- SHA-256 hashed before storage
- Single use - invalidated after successful verification
- Can be used for account recovery

### Rate Limiting

All 2FA endpoints are protected by rate limiting:
- Auth type: 10 requests per minute per IP
- Returns 429 with `Retry-After` header

### Brute Force Protection

- TOTP verification limited to valid codes
- Codes expire after 30 seconds
- Rate limiting prevents rapid attempts

## Configuration

### Environment Variables

Ensure `NEXTAUTH_SECRET` is set for secret encryption:

```bash
NEXTAUTH_SECRET="your-32-character-secret"
```

### Customization

Edit `src/lib/totp.ts` to customize:

```typescript
const APP_NAME = 'Nedcloud Solutions'  // Shows in authenticator app
const BACKUP_CODE_COUNT = 8            // Number of backup codes
```

## Troubleshooting

### "Invalid verification code"

- Ensure device time is synchronized
- Check authenticator app shows correct account
- Try a fresh code (codes expire in 30 seconds)

### Locked Out

If locked out with no backup codes:
1. Access database directly
2. Set `twoFactorEnabled = false` for user
3. User can then log in with password only

### QR Code Not Working

- Try manual entry key instead
- Check authenticator app supports TOTP
- Ensure secret was not corrupted

## Dependencies

```json
{
  "dependencies": {
    "otplib": "^12.0.1",
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5"
  }
}
```
