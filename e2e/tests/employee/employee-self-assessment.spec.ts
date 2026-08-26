import { test, expect } from '@playwright/test';

test.describe('EMP002 — Complete Self Assessment', () => {
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
    await page.click('a[href="/kpis"]');
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
  });

  test('Validation: Rating greater than 5.0 is rejected', async ({ page }) => {
    const firstInput = page.locator('input[type="number"]').first();
    await firstInput.clear();
    await firstInput.fill('6');
    await firstInput.blur();
    await page.click('button:has-text("Save Draft")');

    await expect(page.locator('text=Please correct errors before saving draft.').or(page.locator('text=Rating must be between 0.0 and 5.0')).first()).toBeVisible();
  });

  test('Validation: Negative rating is rejected', async ({ page }) => {
    const firstInput = page.locator('input[type="number"]').first();
    await firstInput.clear();
    await firstInput.fill('-1');
    await firstInput.blur();
    await page.click('button:has-text("Save Draft")');

    await expect(page.locator('text=Please correct errors before saving draft.').or(page.locator('text=Rating must be between 0.0 and 5.0')).first()).toBeVisible();
  });
});
