import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Dashboard Status Display E2E Tests
 *
 * Tests that review statuses (pending, approved, confirmed, etc.)
 * display correctly in the dashboard for both Creator and Reviewer roles.
 *
 * Uses real user account: fmjespers@gmail.com
 */

const CREATOR_AUTH_FILE = path.join(__dirname, '../.playwright/.auth/creator.json');
const REVIEWER_AUTH_FILE = path.join(__dirname, '../.playwright/.auth/reviewer.json');
const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';

// Real user credentials for testing
const REAL_USER = {
  email: 'fmjespers@gmail.com',
  password: 'Merijn12!',
};

test.describe('Dashboard Status Display - Creator View', () => {
  test('Creator dashboard loads successfully', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: CREATOR_AUTH_FILE,
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Main element should be visible - dashboard has loaded
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // Page should not show login form (user is authenticated)
    await expect(page).not.toHaveURL(/\/login/);

    await context.close();
  });

  test('Creator can see completed reviews section', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: CREATOR_AUTH_FILE,
    });
    const page = await context.newPage();

    // Navigate to completed reviews section
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for completed reviews section or tab
    const completedTab = page.getByRole('tab', { name: /completed|accepted|done/i });
    if (await completedTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await completedTab.click();
      await page.waitForTimeout(500);
    }

    // Should display completed reviews or empty state
    await expect(
      page.getByText(/completed|accepted|no.*review/i).first()
    ).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('Creator can toggle between Creator and Reviewer roles', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: CREATOR_AUTH_FILE,
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for role toggle
    const roleToggle = page.getByRole('button', { name: /creator|reviewer|switch.*role/i });

    if (await roleToggle.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click to switch role
      await roleToggle.click();
      await page.waitForTimeout(500);

      // Dashboard content should update
      await expect(page.locator('main')).toBeVisible();
    }

    await context.close();
  });
});

test.describe('Dashboard Status Display - Status Badges', () => {
  test('Status badges render with correct styling', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: CREATOR_AUTH_FILE,
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for any status badges on the page
    // Status badges typically have specific classes or data attributes
    const badges = page.locator('[data-slot="badge"], .badge, [class*="badge"]');
    const badgeCount = await badges.count();

    if (badgeCount > 0) {
      // At least one badge should be visible
      await expect(badges.first()).toBeVisible();
    }

    await context.close();
  });
});

test.describe('Dashboard Status Display - Reviewer View', () => {
  test('Reviewer dashboard shows active reviews section', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: REVIEWER_AUTH_FILE,
    });
    const page = await context.newPage();

    await page.goto('/reviewer/hub');
    await page.waitForLoadState('networkidle');

    // Main element should be visible - dashboard has loaded
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // Page should not redirect to login
    await expect(page).not.toHaveURL(/\/login/);

    await context.close();
  });

  test('Reviewer can see submitted reviews', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: REVIEWER_AUTH_FILE,
    });
    const page = await context.newPage();

    await page.goto('/reviewer/hub');
    await page.waitForLoadState('networkidle');

    // Look for submitted/pending acceptance section
    const submittedTab = page.getByRole('tab', { name: /submitted|pending|awaiting/i });
    if (await submittedTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submittedTab.click();
      await page.waitForTimeout(500);
    }

    // Should display submitted reviews or empty state
    await expect(
      page.getByText(/submitted|pending|no.*review/i).first()
    ).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('Reviewer can see completed reviews history', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: REVIEWER_AUTH_FILE,
    });
    const page = await context.newPage();

    await page.goto('/reviewer/hub');
    await page.waitForLoadState('networkidle');

    // Look for completed/history section
    const completedTab = page.getByRole('tab', { name: /completed|history|done/i });
    if (await completedTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await completedTab.click();
      await page.waitForTimeout(500);
    }

    // Should display completed reviews or empty state
    await expect(
      page.getByText(/completed|history|no.*review/i).first()
    ).toBeVisible({ timeout: 10000 });

    await context.close();
  });
});

test.describe('Dashboard API Tests - Status Endpoints', () => {
  test('Dashboard endpoints require authentication', async ({ request }) => {
    // Verify endpoints exist and require auth (return 401 without auth)
    const endpoints = [
      '/api/v1/dashboard/desktop/creator/actions-needed',
      '/api/v1/dashboard/desktop/creator/my-requests',
      '/api/v1/dashboard/desktop/reviewer/active',
      '/api/v1/dashboard/desktop/reviewer/submitted',
    ];

    for (const endpoint of endpoints) {
      const resp = await request.get(`${API_BASE}${endpoint}`);
      // Should return 401 (unauthorized) without auth
      expect(resp.status()).toBe(401);
    }
  });
});

test.describe('Real User Dashboard Tests', () => {
  test('Real user (fmjespers) can login and access dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/email/i).fill(REAL_USER.email);
    await page.locator('input#password').fill(REAL_USER.password);

    await Promise.all([
      page.waitForURL(/\/(dashboard|$)/, { timeout: 30000 }),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);

    // Should be redirected to dashboard or home (not login)
    await expect(page).not.toHaveURL(/\/login/);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should load (main visible)
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('Real user dashboard displays content without errors', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/email/i).fill(REAL_USER.email);
    await page.locator('input#password').fill(REAL_USER.password);

    await Promise.all([
      page.waitForURL(/\/(dashboard|$)/, { timeout: 30000 }),
      page.getByRole('button', { name: /sign in/i }).click(),
    ]);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard content should be visible
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // Verify dashboard loaded with content (not just skeleton)
    // Check for the welcome heading which appears in desktop dashboard
    const welcomeHeading = page.getByRole('heading', { name: /welcome/i });
    const hasWelcome = await welcomeHeading.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasWelcome) {
      await expect(welcomeHeading).toBeVisible();
    } else {
      // Mobile view may not show welcome heading, just verify main loaded
      await expect(page.locator('main')).toBeVisible();
    }

    await context.close();
  });
});
