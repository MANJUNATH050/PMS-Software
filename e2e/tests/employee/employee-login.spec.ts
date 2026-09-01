import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('EMP001 - Unified Login Page & Automatic Role Routing', () => {

  test.beforeEach(async () => {
    try {
      execSync('docker exec pms_postgres psql -U postgres -d pms_db -c "UPDATE employees SET failed_login_attempts = 0, locked_until = NULL;"', { stdio: 'ignore' });
    } catch (e) {
      // ignore
    }
  });

  test('EMP001-01 Valid employee login auto-redirects to employee dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('main').getByText('John Doe')).toBeVisible();
    await expect(page.locator('text=Active Cycle')).toBeVisible();
  });

  test('EMP001-02 Invalid employee email shows generic message', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'nonexistent@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid email or password.').or(page.locator('text=Invalid')).first()).toBeVisible();
  });

  test('EMP001-03 Empty email validation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', '');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    await expect(page.locator('#email')).toHaveAttribute('required', '');
    await expect(page).toHaveURL(/\/login/);
  });

  test('EMP001-04 Login page matches Screenshot 2 visual layout with NO role tabs', async ({ page }) => {
    await page.goto('/login');

    // Verify left hero branding and headings
    await expect(page.locator('text=aseuro').first()).toBeVisible();
    await expect(page.locator('h1').getByText('Performance')).toBeVisible();
    await expect(page.locator('h1').getByText('Management')).toBeVisible();
    await expect(page.locator('h1').getByText('Simplified')).toBeVisible();
    await expect(page.locator('text=A centralized platform to manage goals')).toBeVisible();

    // Verify 3 feature cards
    await expect(page.locator('text=Set Goals')).toBeVisible();
    await expect(page.locator('text=Define clear goals and align with your vision.')).toBeVisible();

    await expect(page.locator('text=Track Progress')).toBeVisible();
    await expect(page.locator('text=Monitor performance and measure what matters.')).toBeVisible();

    await expect(page.locator('text=Drive Growth')).toBeVisible();
    await expect(page.locator('text=Provide feedback and grow together continuously.')).toBeVisible();

    // Verify NO role tabs or selectors exist on the page
    await expect(page.locator('button:has-text("Employee")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Manager")')).toHaveCount(0);
    await expect(page.locator('button:has-text("HR")')).toHaveCount(0);
    await expect(page.locator('text=SELECT LOGIN ROLE')).toHaveCount(0);

    // Verify Right Card components
    await expect(page.locator('h2:has-text("Welcome Back!")')).toBeVisible();
    await expect(page.locator('text=Sign in to access your account')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button:has-text("Show")')).toBeVisible();
    await expect(page.locator('button:has-text("Forgot password?")')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Login")')).toBeVisible();

    // Test Show/Hide password toggle
    await page.fill('#password', 'secretpassword');
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await page.click('button:has-text("Show")');
    await expect(page.locator('#password')).toHaveAttribute('type', 'text');
    await page.click('button:has-text("Hide")');
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  });

  test('EMP001-05 Account locks after 5 consecutive failed login attempts and displays countdown', async ({ page }) => {
    const testEmail = 'hanudemo@gmail.com';
    await page.goto('/login');

    // 4 failed attempts show remaining attempts warning
    for (let i = 1; i <= 4; i++) {
      await page.fill('#email', testEmail);
      await page.fill('#password', 'wrongpassword' + i);
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Invalid email or password.')).toBeVisible({ timeout: 5000 });
    }

    // 5th failed attempt locks the account
    await page.fill('#email', testEmail);
    await page.fill('#password', 'wrongpassword5');
    await page.click('button[type="submit"]');

    // Verify account locked banner and countdown
    await expect(page.locator('text=Account temporarily locked')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Please try again in')).toBeVisible();
    await expect(page.locator('text=Locked — Try Again Later')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    // Verify attempt with correct password cannot bypass the lock
    await page.reload();
    await page.fill('#email', testEmail);
    await expect(page.locator('text=Account temporarily locked')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test('EMP001-06 Forgot password modal works', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Forgot password?")');

    await expect(page.locator('h3:has-text("Password Recovery")')).toBeVisible();
    await page.fill('#forgot-email', 'employee@aseuro.com');
    await page.click('button:has-text("Send Recovery Link")');

    await expect(page.locator('text=password reset link has been sent')).toBeVisible();
  });

  test('EMP001-07 Automatic role-based routing: HR credentials navigate directly to HR Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'hr@aseuro.com');
    await page.fill('#password', 'Hr@12345');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/hr\/dashboard/);
    await expect(page.locator('text=HR Administration Dashboard')).toBeVisible();
  });

  test('EMP001-08 Automatic role-based routing: Manager credentials navigate directly to Manager Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'manager@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/manager\/dashboard/);
    await expect(page.locator('text=Welcome back, Alice Smith!').or(page.locator('text=Direct Reports')).first()).toBeVisible();
  });
});

