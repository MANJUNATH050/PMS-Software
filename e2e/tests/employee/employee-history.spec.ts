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

  test('EMP009-02 Employee Report Displays HR Review KPI Evaluation Section with 5 Competencies', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // Navigate to My Reports
    await page.click('a[href="/reports"]');
    await expect(page).toHaveURL(/\/reports/);

    // Click View on a finalized appraisal
    const viewBtn = page.locator('button:has-text("View")').first();
    await expect(viewBtn).toBeVisible();
    await viewBtn.click();

    // Verify URL navigated to /history/:id
    await expect(page).toHaveURL(/\/history\/\d+/);

    // 1. Verify Existing Sections: Employee Info, Appraisal Cycle Details, Chart, KPI Breakdown
    await expect(page.locator('text=Employee Information')).toBeVisible();
    await expect(page.locator('text=Appraisal Cycle details')).toBeVisible();
    await expect(page.locator('text=KPI Performance Breakdown')).toBeVisible();

    // 2. Verify NEW HR Review KPIs Section Header & Subtitle
    await expect(page.locator('text=HR Review KPIs')).toBeVisible();
    await expect(page.locator('text=HR Review KPI Evaluation — Corporate Staff')).toBeVisible();
    await expect(page.locator('text=Evaluated by HR Administration')).toBeVisible();

    // 3. Verify HR Review KPI Columns
    await expect(page.locator('th:has-text("HR REVIEW KPI")')).toBeVisible();
    await expect(page.locator('th:has-text("MEASUREMENT CRITERIA")')).toBeVisible();
    await expect(page.locator('th:has-text("WEIGHT")').last()).toBeVisible();
    await expect(page.locator('th:has-text("HR RATING")').last()).toBeVisible();
    await expect(page.locator('th:has-text("STATUS")')).toBeVisible();

    // 4. Verify all 5 HR Review KPI names are present
    await expect(page.locator('text=Leave Pattern')).toBeVisible();
    await expect(page.locator('text=Team Collaboration and Engagement')).toBeVisible();
    await expect(page.locator('text=Punctuality')).toBeVisible();
    await expect(page.locator('text=New Initiatives and Participation')).toBeVisible();
    await expect(page.locator('text=Rewards')).toBeVisible();

    // 5. Verify Measurement Criteria text
    await expect(page.locator('text=Planned leaves should be 95% of total leaves')).toBeVisible();
    await expect(page.locator('text=Active cross-functional collaboration')).toBeVisible();
    await expect(page.locator('text=Adherence to work hours, prompt attendance in scrum meetings')).toBeVisible();

    // 6. Verify FINALIZED status badges
    const finalizedBadges = page.locator('span:has-text("FINALIZED")');
    await expect(finalizedBadges.first()).toBeVisible();
  });
});
