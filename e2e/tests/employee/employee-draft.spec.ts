import { test, expect } from '@playwright/test';

test.describe('EMP003 & EMP004 — Save & Edit Draft', () => {
  test.beforeEach(async ({ request }) => {
    // Reset active cycle to PMS_STARTED
    const loginRes = await request.post('http://localhost:8080/auth/login', {
      data: { email: 'employee@aseuro.com', password: 'password' }
    });
    if (loginRes.ok()) {
      const tokenData = await loginRes.json();
      await request.post('http://localhost:8080/employee/pms/reset-active', {
        headers: { Authorization: `Bearer ${tokenData.token}` }
      });
    }
  });

  test('EMP003-01 Save draft and EMP003-02 Draft persistence', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    // 2. Open My KPIs
    await page.click('a[href="/kpis"]');
    await page.locator('input[type="number"]').first().fill('4.5');
    await page.locator('textarea').first().fill('Draft comment test');
    await page.click('button:has-text("Save Draft")');

    await expect(page.locator('text=Draft saved successfully')).toBeVisible();

    // 3. Logout & Login again
    await page.click('button:has-text("Logout")');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    // 4. Verify draft restored
    await page.click('a[href="/kpis"]');
    await expect(page.locator('input[type="number"]').first()).toHaveValue('4.5');
    await expect(page.locator('textarea').first()).toHaveValue('Draft comment test');
  });

  test('EMP004-02 Edit draft and save modified draft', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    await page.click('a[href="/kpis"]');
    await page.locator('input[type="number"]').first().fill('4.8');
    await page.click('button:has-text("Save Draft")');

    await expect(page.locator('text=Draft saved successfully')).toBeVisible();
    await expect(page.locator('input[type="number"]').first()).toHaveValue('4.8');
  });
});
