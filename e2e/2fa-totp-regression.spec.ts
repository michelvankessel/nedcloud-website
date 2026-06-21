import { test, expect, Page } from '@playwright/test'
import { OTP } from 'otplib'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@nedcloudsolutions.nl'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme-immediately-123!'
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

/**
 * TOTP 2FA Regression Test
 *
 * This test verifies that the existing TOTP 2FA flow continues to work correctly
 * after WebAuthn integration. It tests the complete flow:
 * 1. Enable TOTP for the admin user via API
 * 2. Log out
 * 3. Log in with password
 * 4. Verify TOTP code
 * 5. Assert redirect to /admin
 * 6. Verify TOTP remains enabled in settings
 *
 * Note: This test requires the seeded admin user to exist in the database.
 * The user should be created via: `npm run prisma:seed`
 * with ADMIN_EMAIL and ADMIN_PASSWORD set in .env.local
 * 
 * IMPORTANT: These tests should be run sequentially (--workers=1) and may require
 * running `npm run prisma:seed` between test runs to reset the 2FA state.
 */

test.describe.configure({ mode: 'serial' })

test.describe('TOTP 2FA Regression', () => {

  /**
   * Setup TOTP for the admin user via API
   * This requires a valid session, so we login first via the UI
   */
  async function setupTOTP(page: Page): Promise<{ secret: string; encryptedSecret: string }> {
    // First, login with password only
    await page.goto(`${BASE_URL}/admin/login`)
    
    // Wait for the login form
    await page.waitForSelector('input[name="email"]')
    
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    
    // Wait for redirect to complete - could go to admin or verify-2fa if already enabled
    await page.waitForLoadState('networkidle')

    // Get current URL to see where we ended up
    const currentUrl = page.url()

    // If already on verify-2fa, we're already in TOTP mode - that's OK for this test
    if (currentUrl.includes('/admin/verify-2fa')) {
      console.log('User already has 2FA enabled from previous run - continuing with test')
      // We need to verify with TOTP first, then proceed
       const otp = new OTP()
       const token = otp.generateSync({ secret: process.env.ADMIN_TOTP_SECRET || 'secret' })
       await page.fill('input[placeholder="000000"]', token)
       await page.click('button:has-text("Verify")')
      
      // Now we should be on /admin
     await expect(page).toHaveURL(`${BASE_URL}/admin`)
      
      // Return dummy values since we can't get the original secret
      return { secret: 'already-enabled', encryptedSecret: 'already-enabled' }
    }

    // Should be on /admin now
    if (!currentUrl.includes('/admin')) {
      throw new Error(`Expected to be on /admin, but got: ${currentUrl}`)
    }

    // Call setup API to get TOTP secret (uses current session)
    const setupResponse = await page.request.post(`${BASE_URL}/api/2fa/setup`)
    
    if (!setupResponse.ok()) {
      const errorText = await setupResponse.text()
      throw new Error(`Setup API failed: ${setupResponse.status()} - ${errorText}`)
    }

    const setupData = await setupResponse.json() as {
      secret: string
      encryptedSecret: string
      qrCode: string
    }

    expect(setupData.secret).toBeDefined()
    expect(setupData.encryptedSecret).toBeDefined()
    expect(setupData.qrCode).toBeDefined()

    return {
      secret: setupData.secret,
      encryptedSecret: setupData.encryptedSecret
    }
  }

  /**
   * Verify TOTP and enable 2FA for the user
   */
  async function verifyTOTPAndEnable(
    page: Page,
    secret: string,
    encryptedSecret: string
  ): Promise<string[]> {
    // If 2FA is already enabled, we can't re-enable it
    if (secret === 'already-enabled') {
      return []
    }
    
    // Generate current TOTP token using otplib (sync generate with options)
    const otp = new OTP()
    const token = otp.generateSync({ secret })
    expect(token).toHaveLength(6)
    expect(token).toMatch(/^\d{6}$/)

    // Call verify API to enable 2FA
    const verifyResponse = await page.request.post(`${BASE_URL}/api/2fa/verify`, {
      data: {
        token,
        encryptedSecret
      }
    })
    
    if (!verifyResponse.ok()) {
      const errorText = await verifyResponse.text()
      throw new Error(`Verify API failed: ${verifyResponse.status()} - ${errorText}`)
    }

    const verifyData = await verifyResponse.json() as {
      success: boolean
      backupCodes: string[]
    }

    expect(verifyData.success).toBe(true)
    expect(verifyData.backupCodes).toBeDefined()
    expect(verifyData.backupCodes).toHaveLength(8)

     return verifyData.backupCodes
  }

  /**
   * Logout from the current session
   */
  async function logout(page: Page): Promise<void> {
    // Navigate to signout page and click the sign out button
    await page.goto(`${BASE_URL}/api/auth/signout`)
    await page.waitForLoadState('networkidle')
    
    // Click the sign out button if present
    const signOutButton = page.locator('button:has-text("Sign out")')
    if (await signOutButton.isVisible().catch(() => false)) {
      await signOutButton.click()
      await page.waitForLoadState('networkidle')
    }
    
    // Clear cookies to ensure session is gone
    await page.context().clearCookies()
  }

  /**
   * Login with password and expect redirect to 2FA verification
   */
  async function loginWithPasswordAndExpect2FA(page: Page): Promise<void> {
    // Navigate to login
    await page.goto(`${BASE_URL}/admin/login`)
    
    // Wait for the login form
    await page.waitForSelector('input[name="email"]')

    // Fill credentials
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)

    // Submit
    await page.click('button[type="submit"]')

    // Wait for redirect to 2FA verification page
    await page.waitForURL(`${BASE_URL}/admin/verify-2fa?email=${encodeURIComponent(ADMIN_EMAIL)}`)

    // Verify the page shows the 2FA UI
    await expect(page.locator('h1')).toContainText('Two-Factor Authentication')
    await expect(page.locator('text=Enter the code from your authenticator app')).toBeVisible()
    await expect(page.locator('input[placeholder="000000"]')).toBeVisible()
  }

  /**
   * Enter TOTP code and complete login
   */
  async function verify2FACode(page: Page, secret: string): Promise<void> {
    // Generate current TOTP token using sync generate with options
    const otp = new OTP()
    const token = otp.generateSync({ secret })

    // Enter the TOTP code
    await page.fill('input[placeholder="000000"]', token)

    // Click verify button
    await page.click('button:has-text("Verify")')

    // Wait for redirect to admin
    await page.waitForURL(`${BASE_URL}/admin`)

    // Verify we're on the admin page
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  }
  
  /**
   * Verify with TOTP when we don't have the stored secret
   * (used when 2FA was already enabled from previous test)
   */


  /**
   * Check that 2FA is enabled in settings page
   */
  async function check2FAStatusInSettings(page: Page): Promise<void> {
    // Navigate to settings
    await page.goto(`${BASE_URL}/admin/settings`)

    // Wait for settings page to load
    await page.waitForLoadState('networkidle')

    // Verify 2FA is shown as enabled
    await expect(page.locator('text=2FA is enabled on your account')).toBeVisible()

    // Verify the shield check icon is present (using the text that contains the icon)
    await expect(page.locator('text=Two-Factor Authentication')).toBeVisible()
  }

  /**
   * Verify 2FA status via API
   */
  async function getTOTPStatusFromAPI(page: Page): Promise<{ enabled: boolean; verifiedAt: string | null }> {
    // Check 2FA status via API to verify it's enabled
    const statusResponse = await page.request.get(`${BASE_URL}/api/2fa/status`)
    expect(statusResponse.ok()).toBe(true)

    const statusData = await statusResponse.json() as {
      enabled: boolean
      verifiedAt: string | null
    }

    expect(statusData.enabled).toBe(true)
    expect(statusData.verifiedAt).toBeDefined()

    return statusData
  }

  test('complete TOTP flow - enable, logout, login with TOTP, verify enabled', async ({ page }) => {
    // Step 1: Enable TOTP for admin user via API
    const { secret, encryptedSecret } = await setupTOTP(page)

    // Step 2: Verify TOTP and enable 2FA
    const backupCodes = await verifyTOTPAndEnable(page, secret, encryptedSecret)
    expect(backupCodes.length).toBe(8)

    // Step 3: Log out
    await logout(page)

    // Step 4: Log in with password (should redirect to 2FA verification)
    await loginWithPasswordAndExpect2FA(page)

    // Step 5: Enter TOTP code and complete login
    await verify2FACode(page, secret)

    // Step 6: Verify we're on the admin page and authenticated
    await expect(page).toHaveURL(`${BASE_URL}/admin`)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Step 7: Navigate to settings and verify TOTP is still enabled
    await check2FAStatusInSettings(page)

    // Step 8: Also verify via API that 2FA status is enabled
    await getTOTPStatusFromAPI(page)

    // Cleanup: Disable 2FA using a backup code so subsequent tests start fresh
    const disableResponse = await page.request.post(`${BASE_URL}/api/2fa/disable`, {
      data: { token: backupCodes[0] }
    })
    expect(disableResponse.ok()).toBe(true)
  })

  test('TOTP login rejects invalid code', async ({ page }) => {
    // Setup 2FA first
    const { secret, encryptedSecret } = await setupTOTP(page)
    await verifyTOTPAndEnable(page, secret, encryptedSecret)

    // Log out
    await logout(page)

    // Try to login
    await page.goto(`${BASE_URL}/admin/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')

    // Wait for 2FA page
    await page.waitForURL(`${BASE_URL}/admin/verify-2fa?email=${encodeURIComponent(ADMIN_EMAIL)}`)

    // Enter invalid code
    await page.fill('input[placeholder="000000"]', '000000')
    await page.click('button:has-text("Verify")')

    // Should show error - wait for the error message to appear
    await expect(page.locator('text=Invalid verification code')).toBeVisible({ timeout: 5000 })

    // Clean up: logout
    await logout(page)
  })

  test('TOTP code input validation', async ({ page }) => {
    // Setup 2FA first
    const { secret, encryptedSecret } = await setupTOTP(page)
    await verifyTOTPAndEnable(page, secret, encryptedSecret)

    // Log out
    await logout(page)

    // Try to login
    await page.goto(`${BASE_URL}/admin/login`)
    await page.fill('input[name="email"]', ADMIN_EMAIL)
    await page.fill('input[name="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')

    // Wait for 2FA page
    await page.waitForURL(`${BASE_URL}/admin/verify-2fa?email=${encodeURIComponent(ADMIN_EMAIL)}`)

    // Try to enter non-6-digit code
    const input = page.locator('input[placeholder="000000"]')

    // The input should only accept digits and be limited to 6 characters
    await input.fill('12345')

    // The input value should be restricted (5 digits)
    await expect(input).toHaveValue('12345')

    // Try entering letters (should be stripped)
    await input.fill('abc123')
    await expect(input).toHaveValue('123')

    // Clean up: logout
    await logout(page)
  })
})
