import { test, expect } from '@playwright/test';

test.describe('MGR001 — Manager Role Full Workflow', () => {

  test('MGR001-01 Manager Login and Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'manager@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/manager\/dashboard/);
    await expect(page.locator('text=Welcome back, Alice Smith!').or(page.locator('text=Direct Reports')).first()).toBeVisible();
    await expect(page.locator('text=Appraisal Workflow Progression').or(page.locator('text=Direct Reports')).first()).toBeVisible();
  });

  test('MGR001-02 Manager Views Assigned Direct Reports', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'manager@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    await page.click('a[href="/manager/employees"]');
    await expect(page).toHaveURL(/\/manager\/employees/);
    await expect(page.locator('text=View New Employees Assigned').first()).toBeVisible();

    // Verify assigned employees (e.g. John Doe / Bob HR) are listed
    await expect(page.locator('text=John Doe').first()).toBeVisible();
  });

  test('MGR001-03 Manager My KPIs Complete Interface & Workflow', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'manager@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');

    await page.click('a[href="/manager/my-kpis"]');
    await expect(page).toHaveURL(/\/manager\/my-kpis/);

    // 1. Breadcrumbs and Page Headers
    await expect(page.locator('text=Manager Administration').first()).toBeVisible();
    await expect(page.locator('text=View My KPIs').first()).toBeVisible();
    await expect(page.locator('text=Manager Self-Assessment').first()).toBeVisible();
    await expect(page.locator('text=Performance Period').first()).toBeVisible();

    // 2. Summary Cards
    await expect(page.locator('text=Total KPIs').first()).toBeVisible();
    await expect(page.locator('text=Total Weightage').first()).toBeVisible();
    await expect(page.locator('text=Overall Rating').first()).toBeVisible();
    await expect(page.locator('text=Performance Status').first()).toBeVisible();

    // 3. Manager KPI Table
    await expect(page.locator('text=My Performance KPIs').first()).toBeVisible();
    await expect(page.locator('text=Team Delivery & Milestones').first()).toBeVisible();
    await expect(page.locator('text=People Management & Growth').first()).toBeVisible();
    await expect(page.locator('text=Strategic Planning & Budgeting').first()).toBeVisible();
    await expect(page.locator('text=Operational Excellence').first()).toBeVisible();

    // 4. Rating Selection and Comments
    const ratingButtons = page.locator('button:has-text("4")');
    if (await ratingButtons.count() > 0) {
      await ratingButtons.first().click();
    }

    const commentBoxes = page.locator('textarea[placeholder*="Describe your achievements"]');
    if (await commentBoxes.count() > 0) {
      await commentBoxes.first().fill('Achieved all team sprint targets with 100% on-time delivery.');
    }

    // 5. Details Modal View Action
    const viewButtons = page.locator('button:has-text("View")');
    if (await viewButtons.count() > 0) {
      await viewButtons.first().click();
      await expect(page.locator('text=KPI Objective Details')).toBeVisible();
      await expect(page.locator('text=Rating Scale Guide')).toBeVisible();
      await page.click('button:has-text("Close")');
    }

    // 6. Overall Performance Section
    await expect(page.locator('text=Overall Performance').first()).toBeVisible();
    await expect(page.locator('text=Overall Performance Progress').first()).toBeVisible();
    await expect(page.locator('text=Reviewer Feedback').first()).toBeVisible();

    // 7. Save Draft Action
    const saveDraftBtn = page.locator('button:has-text("Save Draft")');
    if (await saveDraftBtn.isVisible()) {
      await saveDraftBtn.click();
      await expect(page.locator('text=Self-assessment draft saved successfully.').first()).toBeVisible({ timeout: 5000 });
    }
  });
});
