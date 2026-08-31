import { test, expect } from '@playwright/test';

test.describe('EMP008 — View Final Result', () => {
  test('EMP008-01 Final result displayed & read-only', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/reports');
    await expect(page).toHaveURL(/\/reports/);
    await page.locator('button:has-text("View")').first().click();

    await expect(page.locator('text=Appraisal Cycle details')).toBeVisible();
    await expect(page.locator('text=Final Performance Result')).toBeVisible();
    await expect(page.locator('button:has-text("Save Draft")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Submit Self Assessment")')).toHaveCount(0);
  });
});
