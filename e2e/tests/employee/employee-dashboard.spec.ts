import { test, expect } from '@playwright/test';

test.describe('EMP001 — Dashboard Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('EMP001-04 Dashboard loads with employee data', async ({ page }) => {
    await expect(page.getByRole('main').getByText('John Doe')).toBeVisible();
    await expect(page.locator('text=Active Cycle')).toBeVisible();
    await expect(page.locator('text=August 2026')).toBeVisible();

    await page.click('a[href="/profile"]');
    await expect(page.locator('text=Senior Software Engineer')).toBeVisible();
    await expect(page.locator('text=Core Platform')).toBeVisible();
  });

  test('EMP001-05 Employee sees only own data', async ({ page }) => {
    await page.click('a[href="/profile"]');
    await expect(page.locator('text=employee@aseuro.com')).toBeVisible();
    await expect(page.locator('text=Alice Smith')).toBeVisible(); // Reporting manager
  });
});
