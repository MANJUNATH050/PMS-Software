import { test, expect } from '@playwright/test';

test.describe('UI/UX Dynamic State Refinements & Workflow Lifecycle', () => {
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

    // Clear draft ratings for a fresh cycle state
    const assignRes = await request.get('http://localhost:8080/employee/pms/current', {
      headers: { Authorization: `Bearer ${tokenData.token}` }
    });
    if (assignRes.ok()) {
      const assignment = await assignRes.json();
      await request.put(`http://localhost:8080/employee/pms/${assignment.assignmentId}/draft`, {
        headers: { Authorization: `Bearer ${tokenData.token}` },
        data: {
          ratings: assignment.kpis.map((k: any) => ({ kpiId: k.kpiId, selfRating: null, comments: '' }))
        }
      });
    }

    await page.goto('/login');
    await page.fill('#email', 'employee@aseuro.com');
    await page.fill('#password', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('TEST 1: New PMS cycle initial state (0 ratings entered)', async ({ page }) => {
    // 1. Current Self Assessment Card must show 0.00 / 5.00 and 0 / 4 KPIs Rated
    const selfCard = page.locator('div:has(> div > p:text-is("Self Assessment"))').first();
    await expect(selfCard).toBeVisible();
    await expect(selfCard.locator('text=0.00 / 5.00')).toBeVisible();
    await expect(selfCard.locator('text=0 / 4 KPIs Rated')).toBeVisible();

    // 2. Current Workflow Stage Card (Card 3) must show SELF ASSESSMENT / Not Started / Waiting to Start Self Assessment
    const stageCards = page.locator('div:has(> div > p:text-is("Self Assessment"))');
    const stageCard = stageCards.nth(1); // Card 3 has heading "Self Assessment"
    await expect(stageCard).toBeVisible();
    await expect(stageCard.locator('text=Not Started')).toBeVisible();
    await expect(stageCard.locator('text=Waiting to Start Self Assessment')).toBeVisible();

    // 3. Latest Finalized Score
    const finalizedCard = page.locator('div:has(> div > p:text-is("Latest Finalized Score"))').first();
    await expect(finalizedCard).toBeVisible();
    await expect(finalizedCard.locator('text=/ 5.00')).toBeVisible();

    // 4. Action banner must show Start Assessment
    await expect(page.locator('text=Action Required: Self-Assessment Pending')).toBeVisible();
    await expect(page.locator('text=You have completed 0 of 4 assigned KPIs')).toBeVisible();
    await expect(page.locator('button:has-text("Start Assessment")')).toBeVisible();

    // 5. Deadline badge in red
    const deadline = page.locator('text=Deadline: 10 Sept 2026').or(page.locator('text=/Deadline:/'));
    await expect(deadline.first()).toBeVisible();

    // 6. Check My KPIs page initial stats (0% progress, 0% weightage)
    await page.click('a[href="/kpis"]');
    await expect(page).toHaveURL(/.*\/kpis/);

    const summaryCard = page.locator('div:has-text("KPI Rating Summary")').first();
    await expect(summaryCard).toBeVisible();
    expect(await summaryCard.innerText()).toContain('0');
    expect(await summaryCard.innerText()).toContain('/ 4 Completed');

    const weightageCard = page.locator('div:has-text("Completed Weightage")').first();
    expect(await weightageCard.innerText()).toContain('0%');

    await expect(page.locator('text=0% COMPLETE')).toBeVisible();
    await expect(page.locator('text=100% PENDING')).toBeVisible();
  });

  test('TEST 2 & TEST 3: Partial ratings (1 of 4 and 2 of 4 KPIs rated)', async ({ page }) => {
    await page.click('a[href="/kpis"]');
    await expect(page).toHaveURL(/.*\/kpis/);

    const inputs = page.locator('table input[type="number"]');
    await expect(inputs.first()).toBeVisible();

    // Rate 1 KPI: Code Quality (20% weight) with rating 4.0
    await inputs.nth(0).clear();
    await inputs.nth(0).fill('4.0');

    // Verify dynamic UI stats on My KPIs page: 1/4 completed, 20% weightage, 25% progress
    const summaryCard = page.locator('div:has-text("KPI Rating Summary")').first();
    expect(await summaryCard.innerText()).toContain('1');
    expect(await summaryCard.innerText()).toContain('/ 4 Completed');

    const weightageCard = page.locator('div:has-text("Completed Weightage")').first();
    expect(await weightageCard.innerText()).toContain('20%');

    await expect(page.locator('text=25% COMPLETE')).toBeVisible();
    await expect(page.locator('text=75% PENDING')).toBeVisible();

    // Rate 2nd KPI: Delivery & Speed (40% weight) with rating 5.0
    await inputs.nth(1).clear();
    await inputs.nth(1).fill('5.0');

    // Verify dynamic UI stats on My KPIs page: 2/4 completed, 60% weightage, 50% progress
    expect(await summaryCard.innerText()).toContain('2');
    expect(await summaryCard.innerText()).toContain('/ 4 Completed');
    expect(await weightageCard.innerText()).toContain('60%');

    await expect(page.locator('text=50% COMPLETE')).toBeVisible();
    await expect(page.locator('text=50% PENDING')).toBeVisible();

    // Save draft
    await page.click('button:has-text("Save Draft")');
    await expect(page.locator('text=Draft saved successfully').or(page.locator('text=Saved'))).toBeVisible({ timeout: 5000 });

    // Check Dashboard updates
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Weighted average: (4.0 * 20 + 5.0 * 40) / 60 = (80 + 200) / 60 = 4.67
    const selfCard = page.locator('div:has(> div > p:text-is("Self Assessment"))').first();
    await expect(selfCard).toBeVisible();
    await expect(selfCard.locator('text=4.67 / 5.00')).toBeVisible();
    await expect(selfCard.locator('text=2 / 4 KPIs Rated')).toBeVisible();

    // Current Workflow Stage Card (Card 3): Heading "Self Assessment", Status "In Progress", Description "Complete your self-assessment"
    const stageCard = page.locator('div:has(> div > p:text-is("Self Assessment"))').nth(1);
    await expect(stageCard.locator('text=In Progress')).toBeVisible();
    await expect(stageCard.locator('text=Complete your self-assessment')).toBeVisible();

    // Action banner: Continue Assessment
    await expect(page.locator('text=You have completed 2 of 4 assigned KPIs')).toBeVisible();
    await expect(page.locator('button:has-text("Continue Assessment")')).toBeVisible();
  });

  test('TEST 4 & TEST 5: All 4 KPIs rated and submitted lifecycle', async ({ page }) => {
    await page.click('a[href="/kpis"]');
    await expect(page).toHaveURL(/.*\/kpis/);

    const inputs = page.locator('table input[type="number"]');
    await expect(inputs.first()).toBeVisible();

    // Rate all 4 KPIs with 4.1
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      await inputs.nth(i).clear();
      await inputs.nth(i).fill('4.1');
    }

    // Check My KPIs stats before saving/submitting
    const summaryCard = page.locator('div:has-text("KPI Rating Summary")').first();
    expect(await summaryCard.innerText()).toContain('4');
    expect(await summaryCard.innerText()).toContain('/ 4 Completed');

    const weightageCard = page.locator('div:has-text("Completed Weightage")').first();
    expect(await weightageCard.innerText()).toContain('100%');
    await expect(page.locator('text=100% COMPLETE')).toBeVisible();

    // Save draft
    await page.click('button:has-text("Save Draft")');
    await expect(page.locator('text=Draft saved successfully').or(page.locator('text=Saved'))).toBeVisible({ timeout: 5000 });

    // Check Dashboard before submitting
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    const selfCard = page.locator('div:has(> div > p:text-is("Self Assessment"))').first();
    await expect(selfCard.locator('text=4.10 / 5.00')).toBeVisible();
    await expect(selfCard.locator('text=4 / 4 KPIs Rated')).toBeVisible();

    // Card 3 when all 4 are rated before submission: Heading "Self Assessment", Status "Completed", Description "Awaiting Submission"
    const stageCardDraft = page.locator('div:has(> div > p:text-is("Self Assessment"))').nth(1);
    await expect(stageCardDraft.locator('text=Completed')).toBeVisible();
    await expect(stageCardDraft.locator('text=Awaiting Submission')).toBeVisible();

    // Action banner says Submit Assessment when all 4 are rated
    await expect(page.locator('button:has-text("Submit Assessment")')).toBeVisible();

    // Now submit assessment from My KPIs
    await page.click('a[href="/kpis"]');
    await page.click('button:has-text("Submit Self Assessment")');
    await page.locator('div.fixed').locator('button:has-text("Submit Assessment")').click();
    await expect(page.locator('text=Self-assessment submitted successfully')).toBeVisible({ timeout: 5000 });

    // Navigate back to Dashboard
    await page.click('a[href="/dashboard"]');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // Card 3 now shifts to Heading "MANAGER REVIEW", Status "Pending", Description "Awaiting Manager Remarks"
    const managerCard = page.locator('div:has(> div > p:text-is("Manager Review"))').first();
    await expect(managerCard.locator('text=Pending')).toBeVisible();
    await expect(managerCard.locator('text=Awaiting Manager Remarks')).toBeVisible();

    // Banner is informational Submitted banner
    await expect(page.getByRole('heading', { name: 'Self-Assessment Submitted' })).toBeVisible();
    await expect(page.locator('text=Your self-assessment has been submitted and is awaiting manager review.')).toBeVisible();
  });
});
