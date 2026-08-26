import { test, expect } from '@playwright/test';

test.describe('SECURITY / RBAC TESTING', () => {
  test('Unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Employee accessing invalid assignment ID displays error state', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Attempting to access assignment 9999
    await page.goto('/history/9999');
    await expect(page.locator('text=Error Loading Details')).toBeVisible();
  });
});
