import { test, expect } from '@playwright/test';

test.describe('EMP001 - Employee Login Validation', () => {

  test('EMP001-01 Valid employee login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('main').getByText('John Doe')).toBeVisible();
    await expect(page.locator('text=Active Cycle')).toBeVisible();
  });

  test('EMP001-02 Invalid employee email', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'nonexistent@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid email ID.')).toBeVisible();
  });

  test('EMP001-03 Empty email', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', '');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    await expect(page.locator('#email')).toHaveAttribute('required', '');
    await expect(page).toHaveURL(/\/login/);
  });
});
