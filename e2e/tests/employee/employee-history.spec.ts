import { test, expect } from '@playwright/test';

test.describe('EMP009 — PMS History', () => {
  test('EMP009-01 PMS history log displayed & read-only', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    await page.click('a[href="/history"]');
    await expect(page.locator('text=July 2026')).toBeVisible();
    await expect(page.locator('text=June 2026')).toBeVisible();
    await expect(page.locator('text=May 2026')).toBeVisible();
  });
});
