import { test, expect, Page, BrowserContext, CDPSession } from '@playwright/test';
import { OTP } from 'otplib';
import { execSync } from 'child_process';

// Initialize OTP instance for TOTP generation
// Uses Node.js crypto by default in this environment
const otp = new OTP();

/**
 * WebAuthn E2E Test
 *
 * This test covers the full WebAuthn flow:
 * 1. Setup TOTP for the admin user (needed to reach settings)
 * 2. Login with password + TOTP
 * 3. Register a virtual authenticator in settings
 * 4. Logout
 * 5. Login with password + WebAuthn
 * 6. Assert successful authentication
 */

// Load environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@nedcloudsolutions.nl';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme-immediately-123!';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test timeout for WebAuthn operations
const WEBAUTHN_TIMEOUT = 30000;
const LONG_TIMEOUT = 60000;

interface VirtualAuthenticator {
  authenticatorId: string;
}

interface SetupResult {
  success: true;
  secret: string;
}

interface CountResult {
  success: true;
  count: number;
  names: (string | null)[];
}

function runHelper(command: string): string {
  return execSync('npx tsx scripts/e2e-db-helper.ts ' + command, {
    encoding: 'utf8',
    env: {
      ...process.env,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
    },
  });
}

function parseHelperOutput<T>(output: string): T {
  return JSON.parse(output.trim()) as T;
}

test.describe('WebAuthn Registration and Authentication', () => {
  let context: BrowserContext;
  let page: Page;
  let cdpSession: CDPSession;
  let virtualAuthenticator: VirtualAuthenticator | null = null;
  let totpSecret: string;

  test.beforeAll(async ({ browser }) => {
    // Create browser context for WebAuthn testing.
    // Note: Playwright does not support publickey-credentials-* permissions;
    // the virtual authenticator via CDP is sufficient.
    context = await browser.newContext();

    // Setup TOTP for the admin user before tests via ESM-compatible helper
    const output = runHelper('setup-user');
    const result = parseHelperOutput<SetupResult>(output);
    totpSecret = result.secret;
    console.log('Test user setup complete');
  });

  test.beforeEach(async () => {
    page = await context.newPage();

    // Create CDP session for virtual authenticator and enable WebAuthn environment
    cdpSession = await context.newCDPSession(page);
    await cdpSession.send('WebAuthn.enable');

    // Add virtual authenticator for testing
    await addVirtualAuthenticator(cdpSession);
  });

  test.afterEach(async () => {
    // Remove virtual authenticator after each test
    if (virtualAuthenticator && cdpSession) {
      try {
        await cdpSession.send('WebAuthn.removeVirtualAuthenticator', {
          authenticatorId: virtualAuthenticator.authenticatorId,
        });
      } catch {
        // Ignore errors during cleanup
      }
      virtualAuthenticator = null;
    }

    await page.close();
  });

  test.afterAll(async () => {
    // Cleanup: Remove WebAuthn credentials but keep TOTP
    runHelper('cleanup-credentials');
    if (context) {
      await context.close();
    }
  });

  async function addVirtualAuthenticator(session: CDPSession): Promise<void> {
    const response = await session.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'usb',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });

    virtualAuthenticator = {
      authenticatorId: response.authenticatorId,
    };

    console.log('Virtual authenticator added:', virtualAuthenticator.authenticatorId);
  }

  async function loginWithPassword(): Promise<void> {
    console.log('Logging in with password...');

    await page.goto(`${BASE_URL}/admin/login`);

    // Wait for the login form to be ready
    await page.waitForSelector('input[name="email"]', { timeout: WEBAUTHN_TIMEOUT });

    // Fill in credentials
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to verify-2fa page
    await page.waitForURL(/.*\/admin\/verify-2fa.*/, { timeout: WEBAUTHN_TIMEOUT });

    console.log('Password login successful, redirected to 2FA verification');
  }

  async function completeTOTPVerification(): Promise<void> {
    console.log('Completing TOTP verification...');

    // Generate current TOTP code using OTP instance
    const totpCode = otp.generateSync({ secret: totpSecret });
    console.log('Generated TOTP code:', totpCode);

    // Wait for the TOTP input field
    await page.waitForSelector('input[type="text"]', { timeout: WEBAUTHN_TIMEOUT });

    // Fill in TOTP code
    await page.fill('input[type="text"]', totpCode);

    // Click verify button
    await page.click('button[type="submit"]');

    // Wait for redirect to admin dashboard
    await page.waitForURL(/.*\/admin$/, { timeout: WEBAUTHN_TIMEOUT });

    console.log('TOTP verification successful');
  }

  async function logout(): Promise<void> {
    console.log('Logging out...');

    // Navigate to signout endpoint
    await page.goto(`${BASE_URL}/api/auth/signout`);

    // Wait a moment for signout to complete
    await page.waitForTimeout(1000);

    // Clear cookies to ensure session is gone
    await context.clearCookies();

    console.log('Logout complete');
  }

  async function registerSecurityKey(): Promise<void> {
    console.log('Registering security key...');

    // Navigate to settings
    await page.goto(`${BASE_URL}/admin/settings`);

    // Wait for settings page to load
    await page.waitForSelector('h1', { timeout: WEBAUTHN_TIMEOUT });

    // Wait for credentials to load
    await page.waitForSelector('button:has-text("Add Security Key")', { timeout: WEBAUTHN_TIMEOUT });

    // Find and click "Add Security Key" button
    const addKeyButton = page.locator('button', { hasText: /Add Security Key/i });
    await addKeyButton.click();

    // Wait for registration to complete by polling the database helper
    // The virtual authenticator handles the browser prompt automatically
    let credentialCount = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      await page.waitForTimeout(1000);
      const output = runHelper('count-credentials');
      const result = parseHelperOutput<CountResult>(output);
      credentialCount = result.count;
      if (credentialCount > 0) break;
    }

    expect(credentialCount).toBeGreaterThan(0);
    console.log(`Found ${credentialCount} credential(s) in database`);

    // Wait for UI to reflect the new credential (name input appears)
    // Use getByPlaceholder for case-insensitive matching (Playwright-native)
    const nameInput = page.getByPlaceholder(/key name/i).first();
    await nameInput.waitFor({ timeout: WEBAUTHN_TIMEOUT, state: 'visible' });
    await nameInput.fill('YubiKey 5C');

    // Click the Save button for the credential name (not "Save Name" in profile section)
    const saveButton = page.getByRole('button', { name: 'Save', exact: true });
    await saveButton.click();

    // Wait for save to complete and credentials list to refresh
    await page.waitForTimeout(1000);

    // Verify credential appears in list
    await expect(page.getByText(/YubiKey 5C/i).first()).toBeVisible({ timeout: WEBAUTHN_TIMEOUT });

    console.log('Security key registered successfully');
  }

  async function loginWithWebAuthn(): Promise<void> {
    console.log('Logging in with WebAuthn...');

    await page.goto(`${BASE_URL}/admin/login`);

    // Wait for the login form to be ready
    await page.waitForSelector('input[name="email"]', { timeout: WEBAUTHN_TIMEOUT });

    // Fill in credentials
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to verify-2fa page
    await page.waitForURL(/.*\/admin\/verify-2fa.*/, { timeout: WEBAUTHN_TIMEOUT });

    // Click "Use Security Key" button
    const securityKeyButton = page.locator('button', { hasText: /Use Security Key/i });
    await expect(securityKeyButton).toBeVisible({ timeout: WEBAUTHN_TIMEOUT });
    await securityKeyButton.click();

    // Wait for WebAuthn authentication to complete and redirect to admin dashboard
    // The virtual authenticator will handle the browser prompt automatically
    await page.waitForURL(/.*\/admin$/, { timeout: WEBAUTHN_TIMEOUT });

    // Verify we're logged in by checking for admin-specific content
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: WEBAUTHN_TIMEOUT });

    console.log('WebAuthn login successful');
  }

  test('should complete full WebAuthn registration and authentication flow', async () => {
    test.setTimeout(LONG_TIMEOUT);

    // Step 1: Login with password
    await loginWithPassword();

    // Step 2: Complete TOTP verification to reach admin
    await completeTOTPVerification();

    // Step 3: Register security key
    await registerSecurityKey();

    // Step 4: Logout
    await logout();

    // Step 5: Login with WebAuthn
    await loginWithWebAuthn();

    // Final assertion: Verify we're on the admin page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/.*\/admin$/);

    // Verify admin UI is visible
    const pageContent = await page.content();
    expect(pageContent).toContain('Dashboard');
  });

  test('should show security key option on verify-2fa page', async () => {
    // Login with password
    await loginWithPassword();

    // Verify we're on verify-2fa page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/verify-2fa');

    // Verify TOTP input is present
    const totpInput = page.locator('input[type="text"]');
    await expect(totpInput).toBeVisible();

    // Verify "Use Security Key" button is present
    const securityKeyButton = page.locator('button', { hasText: /Use Security Key/i });
    await expect(securityKeyButton).toBeVisible();

    // Verify "Use a different account" link is present
    const differentAccountLink = page.locator('button', { hasText: /Use a different account/i });
    await expect(differentAccountLink).toBeVisible();
  });

  test('should redirect to login when email param is missing', async () => {
    // Navigate directly to verify-2fa without email param
    await page.goto(`${BASE_URL}/admin/verify-2fa`);

    // Wait for redirect to login
    await page.waitForURL(/.*\/admin\/login.*/, { timeout: WEBAUTHN_TIMEOUT });

    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/login');
  });
});
