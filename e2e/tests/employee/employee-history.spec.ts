import { test, expect } from '@playwright/test';

test.describe('EMP009 — My Reports & Navigation Verification', () => {
  test('EMP009-01 Sidebar navigation and My Reports finalized appraisal log', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // 1. Verify Sidebar Navigation items
    await expect(page.locator('a[href="/dashboard"]')).toBeVisible();
    await expect(page.locator('a[href="/kpis"]')).toBeVisible();
    await expect(page.locator('a[href="/reports"]')).toBeVisible();
    await expect(page.locator('a[href="/profile"]')).toBeVisible();
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();

    // 2. Verify PMS History is completely removed from sidebar
    await expect(page.locator('aside a[href="/history"]')).toHaveCount(0);
    await expect(page.locator('aside').getByText('PMS History')).toHaveCount(0);

    // 3. Navigate to My Reports
    await page.click('a[href="/reports"]');
    await expect(page).toHaveURL(/\/reports/);

    // 4. Verify finalized monthly reports are displayed
    await expect(page.locator('text=July 2026 Appraisal')).toBeVisible();
    await expect(page.locator('text=June 2026 Appraisal')).toBeVisible();
    await expect(page.locator('text=May 2026 Appraisal')).toBeVisible();

    // 5. Verify scores and grades are displayed
    await expect(page.locator('text=Score: 4.25 / 5.00')).toBeVisible();
    await expect(page.locator('text=EXCELLENT PERFORMANCE').first()).toBeVisible();

    // 6. Verify actions: only View and Download PDF buttons exist, Excel is completely removed
    await expect(page.locator('button:has-text("View")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Download PDF")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Excel")')).toHaveCount(0);
  });
});
