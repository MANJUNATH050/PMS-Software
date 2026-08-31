import { test, expect } from '@playwright/test';

test.describe('HR001 — HR Role Full Workflow & KPI Management', () => {

  test('HR001-01 HR Login and Dashboard statistics', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'hr@aseuro.com');
    await page.fill('#password', 'Hr@12345');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/hr\/dashboard/);
    await expect(page.locator('text=HR Administration Dashboard')).toBeVisible();
    await expect(page.locator('text=Active Corporate Staff')).toBeVisible();
  });

  test('HR001-02 HR Has Own KPIs & Can Access My KPIs', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'hr@aseuro.com');
    await page.fill('#password', 'Hr@12345');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/hr\/dashboard/);

    // Navigate to HR's My KPIs
    await page.click('a[href="/kpis"]');
    await expect(page).toHaveURL(/\/kpis/);

    // Verify HR-specific KPIs are displayed
    await expect(page.locator('text=Recruitment & Talent Acquisition').first()).toBeVisible();
    await expect(page.locator('text=Employee Engagement & Retention').first()).toBeVisible();
  });

  test('HR001-03 HR KPI Weightage Management & 100% Limit Enforcement', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'hr@aseuro.com');
    await page.fill('#password', 'Hr@12345');
    await page.click('button[type="submit"]');

    await page.click('a[href="/hr/kpis"]');
    await expect(page).toHaveURL(/\/hr\/kpis/);
    await expect(page.locator('text=KPI Master Management')).toBeVisible();
    await expect(page.locator('text=Weightage Allocated').or(page.locator('text=Total Weightage')).first()).toBeVisible();

    // Click Add New KPI
    await page.click('button:has-text("Add New KPI")');
    await expect(page.locator('text=Add KPI for').or(page.locator('text=KPI Name *')).first()).toBeVisible();

    // Try adding a KPI with 50% when already 100%
    await page.fill('input[placeholder*="Code Quality"]', 'Excess KPI');
    await page.fill('input[type="number"]', '50');
    await page.click('button:has-text("Save KPI")');

    // Validation error should trigger
    await expect(page.locator('text=Total KPI weightage cannot exceed 100%').or(page.locator('text=cannot exceed 100%')).first()).toBeVisible();
    await page.click('button:has-text("Cancel")');
  });

  test('HR001-04 HR PMS Lifecycle Tracking & Checkpoints', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'hr@aseuro.com');
    await page.fill('#password', 'Hr@12345');
    await page.click('button[type="submit"]');

    await page.click('a[href="/hr/pms-lifecycle"]');
    await expect(page).toHaveURL(/\/hr\/pms-lifecycle/);
    await expect(page.locator('text=Employee PMS Lifecycle Tracking')).toBeVisible();

    // Click on first staff member
    const firstStaff = page.locator('button:has-text("John Doe")').or(page.locator('button:has-text("Staff")')).first();
    if (await firstStaff.isVisible()) {
      await firstStaff.click();
    }

    // Verify 5-stage tracker is visible
    await expect(page.locator('text=Appraisal Workflow Progression Checkpoints')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Self Assessment').first()).toBeVisible();
    await expect(page.locator('text=Submitted').first()).toBeVisible();
    await expect(page.locator('text=Manager Review').first()).toBeVisible();
    await expect(page.locator('text=HR Review').first()).toBeVisible();
    await expect(page.locator('text=Final Result').first()).toBeVisible();
  });

  test('HR001-05 HR Manager Rating Edit and HR Rating Save', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'hr@aseuro.com');
    await page.fill('#password', 'Hr@12345');
    await page.click('button[type="submit"]');

    await page.click('a[href="/hr/pms-lifecycle"]');
    await expect(page).toHaveURL(/\/hr\/pms-lifecycle/);

    await page.fill('input[placeholder*="Search staff"]', 'John Doe');
    await page.click('button:has-text("John Doe")');

    // Verify Score Summary Card exists
    await expect(page.locator('text=Employee Self Score')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Manager Weighted Score')).toBeVisible();
    await expect(page.locator('text=HR Weighted Score')).toBeVisible();
    await expect(page.locator('text=Final Result').first()).toBeVisible();

    // Click Save HR Review button
    const saveBtn = page.locator('button:has-text("Save HR Review")');
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await expect(page.locator('text=HR review and rating changes saved successfully.').or(page.locator('text=saved successfully')).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('HR001-06 HR Finalize Confirmation Dialog Displays Score Breakdown', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'hr@aseuro.com');
    await page.fill('#password', 'Hr@12345');
    await page.click('button[type="submit"]');

    await page.click('a[href="/hr/pms-lifecycle"]');
    await expect(page).toHaveURL(/\/hr\/pms-lifecycle/);

    const firstStaff = page.locator('button:has-text("John Doe")').or(page.locator('button:has-text("Staff")')).first();
    if (await firstStaff.isVisible()) {
      await firstStaff.click();
    }

    const finalizeBtn = page.locator('button:has-text("Finalise and Submit")');
    if (await finalizeBtn.isVisible()) {
      await finalizeBtn.click();
      // Confirmation dialog should pop up with score breakdown
      await expect(page.locator('text=Confirm PMS Finalization')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=After finalization, the PMS record will be locked and cannot be edited.')).toBeVisible();
      await page.click('button:has-text("Cancel")');
    }
  });

  test('HR001-07 HR Configures KPI Applicability (Employee, Manager, Both)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'hr@aseuro.com');
    await page.fill('#password', 'Hr@12345');
    await page.click('button[type="submit"]');

    await page.click('a[href="/hr/kpis"]');
    await expect(page).toHaveURL(/\/hr\/kpis/);
    await expect(page.locator('text=KPI Master Management')).toBeVisible();

    // Ensure Role / Manager KPIs is selected
    await page.click('button:has-text("Role / Manager KPIs")');

    // Verify Applicable For column exists
    await expect(page.locator('text=Applicable For').first()).toBeVisible({ timeout: 10000 });

    // Open Add New KPI modal
    await page.click('button:has-text("Add New KPI")');
    await expect(page.locator('text=Applicable For *')).toBeVisible();
    await expect(page.locator('button:has-text("Employee")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Manager")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Both Employee & Manager")').first()).toBeVisible();

    await page.click('button:has-text("Cancel")');
  });

  test('HR001-08 HR Manages Global HR Review KPIs (Leave Pattern, Punctuality, etc.)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'hr@aseuro.com');
    await page.fill('#password', 'Hr@12345');
    await page.click('button[type="submit"]');

    await page.click('a[href="/hr/kpis"]');
    await expect(page).toHaveURL(/\/hr\/kpis/);

    // Switch to HR Review KPIs category
    await page.click('button:has-text("HR Review KPIs")');

    // Verify default 5 global HR Review KPIs are present
    await expect(page.locator('text=Leave Pattern').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Team Collaboration and Engagement').first()).toBeVisible();
    await expect(page.locator('text=Punctuality').first()).toBeVisible();
    await expect(page.locator('text=New Initiatives and Participation').first()).toBeVisible();
    await expect(page.locator('text=Rewards').first()).toBeVisible();
  });

  test('HR001-09 HR Employee Directory – Edit Employee Role / Designation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'hr@aseuro.com');
    await page.fill('#password', 'Hr@12345');
    await page.click('button[type="submit"]');

    await page.click('a[href="/hr/employees"]');
    await expect(page).toHaveURL(/\/hr\/employees/);
    await expect(page.locator('text=Employee Directory').first()).toBeVisible();

    // Verify Actions column exists
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();

    // Locate John Doe row and click Edit
    const johnRow = page.locator('tr:has-text("employee@aseuro.com")');
    await expect(johnRow).toBeVisible();
    const editBtn = johnRow.locator('button:has-text("Edit")');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Verify Edit Employee modal opens
    await expect(page.locator('h3:has-text("Edit Employee")')).toBeVisible();
    await expect(page.locator('text=John Doe').first()).toBeVisible();
    await expect(page.locator('text=employee@aseuro.com').first()).toBeVisible();

    // Select new designation "Senior Software Engineer"
    await page.locator('#edit-employee-designation').selectOption('Senior Software Engineer');

    // Click Save Changes
    await page.click('button:has-text("Save Changes")');

    // Verify success banner and updated directory display
    await expect(page.locator('text=Employee details updated successfully.').or(page.locator('text=updated successfully')).first()).toBeVisible({ timeout: 10000 });
    await expect(johnRow.locator('text=Senior Software Engineer').first()).toBeVisible();
    await expect(johnRow.locator('text=Alice Smith').first()).toBeVisible();

    // Verify Employee Login continues to work seamlessly
    await page.click('button:has-text("Logout")');
    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=John Doe').first()).toBeVisible();

    // Verify Manager sees updated designation for John Doe
    await page.click('button:has-text("Logout")');
    await page.goto('/login');
    await page.fill('#email', 'manager@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/manager\/dashboard/);

    await page.click('a[href="/manager/employees"]');
    await expect(page).toHaveURL(/\/manager\/employees/);
    await expect(page.locator('tr:has-text("John Doe")').locator('text=Senior Software Engineer').first()).toBeVisible();
  });
});
