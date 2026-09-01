# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: employee\employee-login.spec.ts >> EMP001 - Unified Login Page & Automatic Role Routing >> EMP001-02 Invalid employee email shows generic message
- Location: tests\employee\employee-login.spec.ts:25:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Invalid email or password.').or(locator('text=Invalid')).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Invalid email or password.').or(locator('text=Invalid')).first()

```

```yaml
- img
- img "Aseuro Logo"
- text: aseuro
- heading "Performance Management Simplified" [level=1]
- paragraph: A centralized platform to manage goals, reviews, feedback and drive continuous growth.
- heading "Set Goals" [level=3]
- paragraph: Define clear goals and align with your vision.
- heading "Track Progress" [level=3]
- paragraph: Monitor performance and measure what matters.
- heading "Drive Growth" [level=3]
- paragraph: Provide feedback and grow together continuously.
- img "Aseuro Logo"
- text: aseuro
- heading "Welcome Back!" [level=2]
- paragraph: Sign in to access your account
- text: e is not a function
- textbox "Enter your email address": nonexistent@aseuro.com
- textbox "Enter your password": password
- button "Show"
- button "Forgot password?"
- button "Login"
- text: © 2026 Aseuro Technologies. All rights reserved.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { execSync } from 'child_process';
  3   | 
  4   | test.describe('EMP001 - Unified Login Page & Automatic Role Routing', () => {
  5   | 
  6   |   test.beforeEach(async () => {
  7   |     try {
  8   |       execSync('docker exec pms_postgres psql -U postgres -d pms_db -c "UPDATE employees SET failed_login_attempts = 0, locked_until = NULL;"', { stdio: 'ignore' });
  9   |     } catch (e) {
  10  |       // ignore
  11  |     }
  12  |   });
  13  | 
  14  |   test('EMP001-01 Valid employee login auto-redirects to employee dashboard', async ({ page }) => {
  15  |     await page.goto('/login');
  16  |     await page.fill('#email', 'employee@aseuro.com');
  17  |     await page.fill('#password', 'password');
  18  |     await page.click('button[type="submit"]');
  19  | 
  20  |     await expect(page).toHaveURL(/\/dashboard/);
  21  |     await expect(page.getByRole('main').getByText('John Doe')).toBeVisible();
  22  |     await expect(page.locator('text=Active Cycle')).toBeVisible();
  23  |   });
  24  | 
  25  |   test('EMP001-02 Invalid employee email shows generic message', async ({ page }) => {
  26  |     await page.goto('/login');
  27  |     await page.fill('#email', 'nonexistent@aseuro.com');
  28  |     await page.fill('#password', 'password');
  29  |     await page.click('button[type="submit"]');
  30  | 
> 31  |     await expect(page.locator('text=Invalid email or password.').or(page.locator('text=Invalid')).first()).toBeVisible();
      |                                                                                                            ^ Error: expect(locator).toBeVisible() failed
  32  |   });
  33  | 
  34  |   test('EMP001-03 Empty email validation', async ({ page }) => {
  35  |     await page.goto('/login');
  36  |     await page.fill('#email', '');
  37  |     await page.fill('#password', 'password');
  38  |     await page.click('button[type="submit"]');
  39  | 
  40  |     await expect(page.locator('#email')).toHaveAttribute('required', '');
  41  |     await expect(page).toHaveURL(/\/login/);
  42  |   });
  43  | 
  44  |   test('EMP001-04 Login page matches Screenshot 2 visual layout with NO role tabs', async ({ page }) => {
  45  |     await page.goto('/login');
  46  | 
  47  |     // Verify left hero branding and headings
  48  |     await expect(page.locator('text=aseuro').first()).toBeVisible();
  49  |     await expect(page.locator('h1').getByText('Performance')).toBeVisible();
  50  |     await expect(page.locator('h1').getByText('Management')).toBeVisible();
  51  |     await expect(page.locator('h1').getByText('Simplified')).toBeVisible();
  52  |     await expect(page.locator('text=A centralized platform to manage goals')).toBeVisible();
  53  | 
  54  |     // Verify 3 feature cards
  55  |     await expect(page.locator('text=Set Goals')).toBeVisible();
  56  |     await expect(page.locator('text=Define clear goals and align with your vision.')).toBeVisible();
  57  | 
  58  |     await expect(page.locator('text=Track Progress')).toBeVisible();
  59  |     await expect(page.locator('text=Monitor performance and measure what matters.')).toBeVisible();
  60  | 
  61  |     await expect(page.locator('text=Drive Growth')).toBeVisible();
  62  |     await expect(page.locator('text=Provide feedback and grow together continuously.')).toBeVisible();
  63  | 
  64  |     // Verify NO role tabs or selectors exist on the page
  65  |     await expect(page.locator('button:has-text("Employee")')).toHaveCount(0);
  66  |     await expect(page.locator('button:has-text("Manager")')).toHaveCount(0);
  67  |     await expect(page.locator('button:has-text("HR")')).toHaveCount(0);
  68  |     await expect(page.locator('text=SELECT LOGIN ROLE')).toHaveCount(0);
  69  | 
  70  |     // Verify Right Card components
  71  |     await expect(page.locator('h2:has-text("Welcome Back!")')).toBeVisible();
  72  |     await expect(page.locator('text=Sign in to access your account')).toBeVisible();
  73  |     await expect(page.locator('#email')).toBeVisible();
  74  |     await expect(page.locator('#password')).toBeVisible();
  75  |     await expect(page.locator('button:has-text("Show")')).toBeVisible();
  76  |     await expect(page.locator('button:has-text("Forgot password?")')).toBeVisible();
  77  |     await expect(page.locator('button[type="submit"]:has-text("Login")')).toBeVisible();
  78  | 
  79  |     // Test Show/Hide password toggle
  80  |     await page.fill('#password', 'secretpassword');
  81  |     await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  82  |     await page.click('button:has-text("Show")');
  83  |     await expect(page.locator('#password')).toHaveAttribute('type', 'text');
  84  |     await page.click('button:has-text("Hide")');
  85  |     await expect(page.locator('#password')).toHaveAttribute('type', 'password');
  86  |   });
  87  | 
  88  |   test('EMP001-05 Account locks after 5 consecutive failed login attempts and displays countdown', async ({ page }) => {
  89  |     const testEmail = 'hanudemo@gmail.com';
  90  |     await page.goto('/login');
  91  | 
  92  |     // 4 failed attempts show remaining attempts warning
  93  |     for (let i = 1; i <= 4; i++) {
  94  |       await page.fill('#email', testEmail);
  95  |       await page.fill('#password', 'wrongpassword' + i);
  96  |       await page.click('button[type="submit"]');
  97  |       await expect(page.locator('text=Invalid email or password.')).toBeVisible({ timeout: 5000 });
  98  |     }
  99  | 
  100 |     // 5th failed attempt locks the account
  101 |     await page.fill('#email', testEmail);
  102 |     await page.fill('#password', 'wrongpassword5');
  103 |     await page.click('button[type="submit"]');
  104 | 
  105 |     // Verify account locked banner and countdown
  106 |     await expect(page.locator('text=Account temporarily locked')).toBeVisible({ timeout: 10000 });
  107 |     await expect(page.locator('text=Please try again in')).toBeVisible();
  108 |     await expect(page.locator('text=Locked — Try Again Later')).toBeVisible();
  109 |     await expect(page.locator('button[type="submit"]')).toBeDisabled();
  110 | 
  111 |     // Verify attempt with correct password cannot bypass the lock
  112 |     await page.reload();
  113 |     await page.fill('#email', testEmail);
  114 |     await expect(page.locator('text=Account temporarily locked')).toBeVisible();
  115 |     await expect(page.locator('button[type="submit"]')).toBeDisabled();
  116 |   });
  117 | 
  118 |   test('EMP001-06 Forgot password modal works', async ({ page }) => {
  119 |     await page.goto('/login');
  120 |     await page.click('button:has-text("Forgot password?")');
  121 | 
  122 |     await expect(page.locator('h3:has-text("Password Recovery")')).toBeVisible();
  123 |     await page.fill('#forgot-email', 'employee@aseuro.com');
  124 |     await page.click('button:has-text("Send Recovery Link")');
  125 | 
  126 |     await expect(page.locator('text=password reset link has been sent')).toBeVisible();
  127 |   });
  128 | 
  129 |   test('EMP001-07 Automatic role-based routing: HR credentials navigate directly to HR Dashboard', async ({ page }) => {
  130 |     await page.goto('/login');
  131 |     await page.fill('#email', 'hr@aseuro.com');
```