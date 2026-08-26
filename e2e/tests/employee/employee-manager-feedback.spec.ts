import { test, expect } from '@playwright/test';

test.describe('EMP007 — View Manager Feedback', () => {
  test('EMP007-01 Manager feedback displayed and EMP007-02 Manager rating read-only', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/history/2'); // July 2026 finalized assignment with manager feedback

    await expect(page.locator('text=John performed exceptionally well this month').first()).toBeVisible();
    await expect(page.locator('input[type="number"]')).toHaveCount(0); // Cannot edit ratings
  });
});
