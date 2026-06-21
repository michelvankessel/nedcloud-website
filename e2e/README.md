# WebAuthn E2E Tests

This directory contains Playwright E2E tests for WebAuthn functionality.

## Prerequisites

1. **Install Playwright browsers** (if not already done):
   ```bash
   npx playwright install chromium
   ```

2. **Ensure environment variables are set** in `.env.local`:
   - `ADMIN_EMAIL` - Admin user email
   - `ADMIN_PASSWORD` - Admin user password
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - JWT encryption secret

3. **Database is running**:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

4. **Application is running** (or use auto-start):
   ```bash
   npm run dev
   ```

## Running Tests

### Run all E2E tests
```bash
npx playwright test e2e/
```

### Run specific test file
```bash
npx playwright test e2e/webauthn.spec.ts
```

### Run in headed mode (see browser)
```bash
npx playwright test e2e/webauthn.spec.ts --headed
```

### Run with debug mode
```bash
npx playwright test e2e/webauthn.spec.ts --debug
```

## Test Coverage

### `webauthn.spec.ts`

Tests the complete WebAuthn flow:

1. **Setup**: Creates admin user with TOTP enabled
2. **TOTP Login**: Logs in with password + TOTP code
3. **Registration**: Registers virtual security key in settings
4. **Logout**: Signs out
5. **WebAuthn Login**: Logs in with password + WebAuthn
6. **Assertions**: Verifies credential persistence and successful authentication

### Virtual Authenticator

Uses Chrome DevTools Protocol (CDP) to simulate a hardware security key:
- Protocol: CTAP2
- Transport: USB
- Resident key support: Enabled
- User verification: Enabled
- Automatic presence simulation: Enabled

## Test Data

Tests automatically:
- Clean up WebAuthn credentials after each run
- Generate TOTP secrets using `otplib`
- Use the seeded admin credentials from `.env.local`

## Troubleshooting

### Test fails with "browser not found"
Install Playwright browsers:
```bash
npx playwright install
```

### Test fails with database connection
Ensure PostgreSQL is running:
```bash
docker compose -f docker-compose.dev.yml up -d
```

### Test fails with 404 errors
Ensure the Next.js dev server is running on port 3000, or the `webServer` config in `playwright.config.ts` will auto-start it.

### WebAuthn operations timeout
The virtual authenticator requires Chromium. Tests are configured to only run on Chromium.

## Configuration

See `playwright.config.ts` in the project root for:
- Base URL configuration
- Browser settings
- Screenshot/video capture settings
- Parallel execution settings
