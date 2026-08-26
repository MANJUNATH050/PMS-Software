import { test, expect } from '@playwright/test';

test.describe('EMP005 — Submit Self Assessment', () => {
  test.beforeEach(async ({ page, request }) => {
    // Reset active cycle to PMS_STARTED
    const loginRes = await request.post('http://localhost:8080/auth/login', {
      data: { email: 'employee@aseuro.com', password: 'password' }
    });
    expect(loginRes.ok()).toBeTruthy();
    const tokenData = await loginRes.json();
    const resetRes = await request.post('http://localhost:8080/employee/pms/reset-active', {
      headers: { Authorization: `Bearer ${tokenData.token}` }
    });
    expect(resetRes.ok()).toBeTruthy();

    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('EMP005-02 Block incomplete submission', async ({ page }) => {
    await page.click('a[href="/kpis"]');
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
    
    // Clear first rating cleanly using native Playwright clear()
    const firstInput = page.locator('input[type="number"]').first();
    await firstInput.clear();
    await firstInput.blur();
    
    await page.click('button:has-text("Submit Self Assessment")');
    await page.click('button:has-text("Submit Assessment")');

    await expect(page.locator('text=All KPIs must be rated with valid values (0.0 - 5.0) before submitting.').or(page.locator('text=Rating is required')).first()).toBeVisible();
  });

  test('EMP005-03 Submission confirmation modal', async ({ page }) => {
    await page.click('a[href="/kpis"]');
    await expect(page.locator('button:has-text("Submit Self Assessment")')).toBeVisible();
    await page.click('button:has-text("Submit Self Assessment")');

    await expect(page.locator('text=Submit Self Assessment?')).toBeVisible();
    await page.click('button:has-text("Cancel")');
  });
});
