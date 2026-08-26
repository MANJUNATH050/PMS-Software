import { test, expect } from '@playwright/test';

test.describe('EMP006 — Track Submission Status', () => {
  test('EMP006-01 Submission status displayed on dashboard timeline', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Appraisal Workflow Tracking')).toBeVisible();
    await expect(page.locator('text=Self Assessment').first()).toBeVisible();
    await expect(page.locator('text=Manager Review').first()).toBeVisible();
    await expect(page.locator('text=HR Review').first()).toBeVisible();
  });
});
