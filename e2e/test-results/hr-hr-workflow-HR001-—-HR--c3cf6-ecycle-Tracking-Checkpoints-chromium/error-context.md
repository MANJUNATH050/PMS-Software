# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hr\hr-workflow.spec.ts >> HR001 — HR Role Full Workflow & KPI Management >> HR001-04 HR PMS Lifecycle Tracking & Checkpoints
- Location: tests\hr\hr-workflow.spec.ts:58:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('a[href="/hr/pms-lifecycle"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img "Aseuro Logo" [ref=e8]
        - generic [ref=e9]: aseuro
      - generic [ref=e10]:
        - heading "Performance Management Simplified" [level=1] [ref=e11]: PerformanceManagementSimplified
        - paragraph [ref=e13]: A centralized platform to manage goals, reviews, feedback and drive continuous growth.
      - generic [ref=e14]:
        - generic [ref=e21]:
          - heading "Set Goals" [level=3] [ref=e22]
          - paragraph [ref=e23]: Define clear goals and align with your vision.
        - generic [ref=e27]:
          - heading "Track Progress" [level=3] [ref=e28]
          - paragraph [ref=e29]: Monitor performance and measure what matters.
        - generic [ref=e35]:
          - heading "Drive Growth" [level=3] [ref=e36]
          - paragraph [ref=e37]: Provide feedback and grow together continuously.
    - generic [ref=e39]:
      - generic [ref=e40]:
        - img "Aseuro Logo" [ref=e42]
        - generic [ref=e43]: aseuro
      - generic [ref=e44]:
        - heading "Welcome Back!" [level=2] [ref=e45]
        - paragraph [ref=e46]: Sign in to access your account
      - generic [ref=e47]: e is not a function
      - generic [ref=e51]:
        - textbox "Enter your email address" [ref=e56]: hr@aseuro.com
        - generic [ref=e57]:
          - textbox "Enter your password" [ref=e61]: Hr@12345
          - button "Show" [ref=e62]
        - button "Forgot password?" [ref=e64]
        - button "Login" [active] [ref=e66]
  - generic [ref=e77]: © 2026 Aseuro Technologies. All rights reserved.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('HR001 — HR Role Full Workflow & KPI Management', () => {
  4   | 
  5   |   test('HR001-01 HR Login and Dashboard statistics', async ({ page }) => {
  6   |     await page.goto('/login');
  7   |     await page.fill('#email', 'hr@aseuro.com');
  8   |     await page.fill('#password', 'Hr@12345');
  9   |     await page.click('button[type="submit"]');
  10  | 
  11  |     await expect(page).toHaveURL(/\/hr\/dashboard/);
  12  |     await expect(page.locator('text=HR Administration Dashboard')).toBeVisible();
  13  |     await expect(page.locator('text=Active Corporate Staff')).toBeVisible();
  14  |   });
  15  | 
  16  |   test('HR001-02 HR Has Own KPIs & Can Access My KPIs', async ({ page }) => {
  17  |     await page.goto('/login');
  18  |     await page.fill('#email', 'hr@aseuro.com');
  19  |     await page.fill('#password', 'Hr@12345');
  20  |     await page.click('button[type="submit"]');
  21  | 
  22  |     await expect(page).toHaveURL(/\/hr\/dashboard/);
  23  | 
  24  |     // Navigate to HR's My KPIs
  25  |     await page.click('a[href="/kpis"]');
  26  |     await expect(page).toHaveURL(/\/kpis/);
  27  | 
  28  |     // Verify HR-specific KPIs are displayed
  29  |     await expect(page.locator('text=Recruitment & Talent Acquisition').first()).toBeVisible();
  30  |     await expect(page.locator('text=Employee Engagement & Retention').first()).toBeVisible();
  31  |   });
  32  | 
  33  |   test('HR001-03 HR KPI Weightage Management & 100% Limit Enforcement', async ({ page }) => {
  34  |     await page.goto('/login');
  35  |     await page.fill('#email', 'hr@aseuro.com');
  36  |     await page.fill('#password', 'Hr@12345');
  37  |     await page.click('button[type="submit"]');
  38  | 
  39  |     await page.click('a[href="/hr/kpis"]');
  40  |     await expect(page).toHaveURL(/\/hr\/kpis/);
  41  |     await expect(page.locator('text=KPI Master Management')).toBeVisible();
  42  |     await expect(page.locator('text=Weightage Allocated').or(page.locator('text=Total Weightage')).first()).toBeVisible();
  43  | 
  44  |     // Click Add New KPI
  45  |     await page.click('button:has-text("Add New KPI")');
  46  |     await expect(page.locator('text=Add KPI for').or(page.locator('text=KPI Name *')).first()).toBeVisible();
  47  | 
  48  |     // Try adding a KPI with 50% when already 100%
  49  |     await page.fill('input[placeholder*="Code Quality"]', 'Excess KPI');
  50  |     await page.fill('input[type="number"]', '50');
  51  |     await page.click('button:has-text("Save KPI")');
  52  | 
  53  |     // Validation error should trigger
  54  |     await expect(page.locator('text=Total KPI weightage cannot exceed 100%').or(page.locator('text=cannot exceed 100%')).first()).toBeVisible();
  55  |     await page.click('button:has-text("Cancel")');
  56  |   });
  57  | 
  58  |   test('HR001-04 HR PMS Lifecycle Tracking & Checkpoints', async ({ page }) => {
  59  |     await page.goto('/login');
  60  |     await page.fill('#email', 'hr@aseuro.com');
  61  |     await page.fill('#password', 'Hr@12345');
  62  |     await page.click('button[type="submit"]');
  63  | 
> 64  |     await page.click('a[href="/hr/pms-lifecycle"]');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  65  |     await expect(page).toHaveURL(/\/hr\/pms-lifecycle/);
  66  |     await expect(page.locator('text=Employee PMS Lifecycle Tracking')).toBeVisible();
  67  | 
  68  |     // Click on first staff member
  69  |     const firstStaff = page.locator('button:has-text("John Doe")').or(page.locator('button:has-text("Staff")')).first();
  70  |     if (await firstStaff.isVisible()) {
  71  |       await firstStaff.click();
  72  |     }
  73  | 
  74  |     // Verify 5-stage tracker is visible
  75  |     await expect(page.locator('text=Appraisal Workflow Progression Checkpoints')).toBeVisible({ timeout: 10000 });
  76  |     await expect(page.locator('text=Self Assessment').first()).toBeVisible();
  77  |     await expect(page.locator('text=Submitted').first()).toBeVisible();
  78  |     await expect(page.locator('text=Manager Review').first()).toBeVisible();
  79  |     await expect(page.locator('text=HR Review').first()).toBeVisible();
  80  |     await expect(page.locator('text=Final Result').first()).toBeVisible();
  81  |   });
  82  | 
  83  |   test('HR001-05 HR Manager Rating Edit and HR Rating Save', async ({ page }) => {
  84  |     await page.goto('/login');
  85  |     await page.fill('#email', 'hr@aseuro.com');
  86  |     await page.fill('#password', 'Hr@12345');
  87  |     await page.click('button[type="submit"]');
  88  | 
  89  |     await page.click('a[href="/hr/pms-lifecycle"]');
  90  |     await expect(page).toHaveURL(/\/hr\/pms-lifecycle/);
  91  | 
  92  |     await page.fill('input[placeholder*="Search staff"]', 'John Doe');
  93  |     await page.click('button:has-text("John Doe")');
  94  | 
  95  |     // Verify Score Summary Card exists
  96  |     await expect(page.locator('text=Employee Self Score')).toBeVisible({ timeout: 10000 });
  97  |     await expect(page.locator('text=Manager Weighted Score')).toBeVisible();
  98  |     await expect(page.locator('text=HR Weighted Score')).toBeVisible();
  99  |     await expect(page.locator('text=Final Result').first()).toBeVisible();
  100 | 
  101 |     // Click Save HR Review button
  102 |     const saveBtn = page.locator('button:has-text("Save HR Review")');
  103 |     if (await saveBtn.isVisible()) {
  104 |       await saveBtn.click();
  105 |       await expect(page.locator('text=HR review and rating changes saved successfully.').or(page.locator('text=saved successfully')).first()).toBeVisible({ timeout: 10000 });
  106 |     }
  107 |   });
  108 | 
  109 |   test('HR001-06 HR Finalize Confirmation Dialog Displays Score Breakdown', async ({ page }) => {
  110 |     await page.goto('/login');
  111 |     await page.fill('#email', 'hr@aseuro.com');
  112 |     await page.fill('#password', 'Hr@12345');
  113 |     await page.click('button[type="submit"]');
  114 | 
  115 |     await page.click('a[href="/hr/pms-lifecycle"]');
  116 |     await expect(page).toHaveURL(/\/hr\/pms-lifecycle/);
  117 | 
  118 |     const firstStaff = page.locator('button:has-text("John Doe")').or(page.locator('button:has-text("Staff")')).first();
  119 |     if (await firstStaff.isVisible()) {
  120 |       await firstStaff.click();
  121 |     }
  122 | 
  123 |     const finalizeBtn = page.locator('button:has-text("Finalise and Submit")');
  124 |     if (await finalizeBtn.isVisible()) {
  125 |       await finalizeBtn.click();
  126 |       // Confirmation dialog should pop up with score breakdown
  127 |       await expect(page.locator('text=Confirm PMS Finalization')).toBeVisible({ timeout: 10000 });
  128 |       await expect(page.locator('text=After finalization, the PMS record will be locked and cannot be edited.')).toBeVisible();
  129 |       await page.click('button:has-text("Cancel")');
  130 |     }
  131 |   });
  132 | 
  133 |   test('HR001-07 HR Configures KPI Applicability (Employee, Manager, Both)', async ({ page }) => {
  134 |     await page.goto('/login');
  135 |     await page.fill('#email', 'hr@aseuro.com');
  136 |     await page.fill('#password', 'Hr@12345');
  137 |     await page.click('button[type="submit"]');
  138 | 
  139 |     await page.click('a[href="/hr/kpis"]');
  140 |     await expect(page).toHaveURL(/\/hr\/kpis/);
  141 |     await expect(page.locator('text=KPI Master Management')).toBeVisible();
  142 | 
  143 |     // Ensure Role / Manager KPIs is selected
  144 |     await page.click('button:has-text("Role / Manager KPIs")');
  145 | 
  146 |     // Verify Applicable For column exists
  147 |     await expect(page.locator('text=Applicable For').first()).toBeVisible({ timeout: 10000 });
  148 | 
  149 |     // Open Add New KPI modal
  150 |     await page.click('button:has-text("Add New KPI")');
  151 |     await expect(page.locator('text=Applicable For *')).toBeVisible();
  152 |     await expect(page.locator('button:has-text("Employee")').first()).toBeVisible();
  153 |     await expect(page.locator('button:has-text("Manager")').first()).toBeVisible();
  154 |     await expect(page.locator('button:has-text("Both Employee & Manager")').first()).toBeVisible();
  155 | 
  156 |     await page.click('button:has-text("Cancel")');
  157 |   });
  158 | 
  159 |   test('HR001-08 HR Manages Global HR Review KPIs (Leave Pattern, Punctuality, etc.)', async ({ page }) => {
  160 |     await page.goto('/login');
  161 |     await page.fill('#email', 'hr@aseuro.com');
  162 |     await page.fill('#password', 'Hr@12345');
  163 |     await page.click('button[type="submit"]');
  164 | 
```