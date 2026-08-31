# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: manager\manager-workflow.spec.ts >> MGR001 — Manager Role Full Workflow >> MGR001-03 Manager My KPIs Complete Interface & Workflow
- Location: tests\manager\manager-workflow.spec.ts:30:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('a[href="/manager/my-kpis"]')

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
        - textbox "Enter your email address" [ref=e56]: manager@aseuro.com
        - generic [ref=e57]:
          - textbox "Enter your password" [ref=e61]: password
          - button "Show" [ref=e62]
        - button "Forgot password?" [ref=e64]
        - button "Login" [active] [ref=e66]
  - generic [ref=e77]: © 2026 Aseuro Technologies. All rights reserved.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('MGR001 — Manager Role Full Workflow', () => {
  4  | 
  5  |   test('MGR001-01 Manager Login and Dashboard', async ({ page }) => {
  6  |     await page.goto('/login');
  7  |     await page.fill('#email', 'manager@aseuro.com');
  8  |     await page.fill('#password', 'password');
  9  |     await page.click('button[type="submit"]');
  10 | 
  11 |     await expect(page).toHaveURL(/\/manager\/dashboard/);
  12 |     await expect(page.locator('text=Welcome back, Alice Smith!').or(page.locator('text=Direct Reports')).first()).toBeVisible();
  13 |     await expect(page.locator('text=Appraisal Workflow Progression').or(page.locator('text=Direct Reports')).first()).toBeVisible();
  14 |   });
  15 | 
  16 |   test('MGR001-02 Manager Views Assigned Direct Reports', async ({ page }) => {
  17 |     await page.goto('/login');
  18 |     await page.fill('#email', 'manager@aseuro.com');
  19 |     await page.fill('#password', 'password');
  20 |     await page.click('button[type="submit"]');
  21 | 
  22 |     await page.click('a[href="/manager/employees"]');
  23 |     await expect(page).toHaveURL(/\/manager\/employees/);
  24 |     await expect(page.locator('text=View New Employees Assigned').first()).toBeVisible();
  25 | 
  26 |     // Verify assigned employees (e.g. John Doe / Bob HR) are listed
  27 |     await expect(page.locator('text=John Doe').first()).toBeVisible();
  28 |   });
  29 | 
  30 |   test('MGR001-03 Manager My KPIs Complete Interface & Workflow', async ({ page }) => {
  31 |     await page.goto('/login');
  32 |     await page.fill('#email', 'manager@aseuro.com');
  33 |     await page.fill('#password', 'password');
  34 |     await page.click('button[type="submit"]');
  35 | 
> 36 |     await page.click('a[href="/manager/my-kpis"]');
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  37 |     await expect(page).toHaveURL(/\/manager\/my-kpis/);
  38 | 
  39 |     // 1. Breadcrumbs and Page Headers
  40 |     await expect(page.locator('text=Manager Administration').first()).toBeVisible();
  41 |     await expect(page.locator('text=View My KPIs').first()).toBeVisible();
  42 |     await expect(page.locator('text=Manager Self-Assessment').first()).toBeVisible();
  43 |     await expect(page.locator('text=Performance Period').first()).toBeVisible();
  44 | 
  45 |     // 2. Summary Cards
  46 |     await expect(page.locator('text=Total KPIs').first()).toBeVisible();
  47 |     await expect(page.locator('text=Total Weightage').first()).toBeVisible();
  48 |     await expect(page.locator('text=Overall Rating').first()).toBeVisible();
  49 |     await expect(page.locator('text=Performance Status').first()).toBeVisible();
  50 | 
  51 |     // 3. Manager KPI Table
  52 |     await expect(page.locator('text=My Performance KPIs').first()).toBeVisible();
  53 |     await expect(page.locator('text=Team Delivery & Milestones').first()).toBeVisible();
  54 |     await expect(page.locator('text=People Management & Growth').first()).toBeVisible();
  55 |     await expect(page.locator('text=Strategic Planning & Budgeting').first()).toBeVisible();
  56 |     await expect(page.locator('text=Operational Excellence').first()).toBeVisible();
  57 | 
  58 |     // 4. Rating Selection and Comments
  59 |     const ratingButtons = page.locator('button:has-text("4")');
  60 |     if (await ratingButtons.count() > 0) {
  61 |       await ratingButtons.first().click();
  62 |     }
  63 | 
  64 |     const commentBoxes = page.locator('textarea[placeholder*="Describe your achievements"]');
  65 |     if (await commentBoxes.count() > 0) {
  66 |       await commentBoxes.first().fill('Achieved all team sprint targets with 100% on-time delivery.');
  67 |     }
  68 | 
  69 |     // 5. Details Modal View Action
  70 |     const viewButtons = page.locator('button:has-text("View")');
  71 |     if (await viewButtons.count() > 0) {
  72 |       await viewButtons.first().click();
  73 |       await expect(page.locator('text=KPI Objective Details')).toBeVisible();
  74 |       await expect(page.locator('text=Rating Scale Guide')).toBeVisible();
  75 |       await page.click('button:has-text("Close")');
  76 |     }
  77 | 
  78 |     // 6. Overall Performance Section
  79 |     await expect(page.locator('text=Overall Performance').first()).toBeVisible();
  80 |     await expect(page.locator('text=Overall Performance Progress').first()).toBeVisible();
  81 |     await expect(page.locator('text=Reviewer Feedback').first()).toBeVisible();
  82 | 
  83 |     // 7. Save Draft Action
  84 |     const saveDraftBtn = page.locator('button:has-text("Save Draft")');
  85 |     if (await saveDraftBtn.isVisible()) {
  86 |       await saveDraftBtn.click();
  87 |       await expect(page.locator('text=Self-assessment draft saved successfully.').first()).toBeVisible({ timeout: 5000 });
  88 |     }
  89 |   });
  90 | });
  91 | 
```