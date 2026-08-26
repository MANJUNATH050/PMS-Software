import { test, expect } from '@playwright/test';

test.describe('EMP002 — KPI Requirements', () => {
  test.beforeEach(async ({ page, request }) => {
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

    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
  });

  test('EMP002-01 KPI list displayed', async ({ page }) => {
    await page.click('a[href="/kpis"]');
    await expect(page).toHaveURL(/\/kpis/);
    await expect(page.locator('text=My Assigned KPIs')).toBeVisible();

    await expect(page.locator('text=Code Quality').first()).toBeVisible();
    await expect(page.locator('text=Delivery & Speed').first()).toBeVisible();
    await expect(page.locator('text=Communication & Collaboration').first()).toBeVisible();
    await expect(page.locator('text=Innovation & Optimization').first()).toBeVisible();
  });

  test('EMP002-02 Current month KPI editable', async ({ page }) => {
    await page.click('a[href="/kpis"]');
    await expect(page.locator('input[type="number"]').first()).toBeEditable();
  });

  test('EMP002-03 Previous month KPI read-only', async ({ page }) => {
    await page.goto('/history/2'); // July 2026 finalized assignment
    await expect(page.locator('input[type="number"]')).toHaveCount(0);
  });
});
