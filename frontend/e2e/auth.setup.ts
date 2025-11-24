import { test as setup, expect } from '@playwright/test';
import path from 'path';

const CREATOR_AUTH_FILE = path.join(__dirname, '../.playwright/.auth/creator.json');
const REVIEWER_AUTH_FILE = path.join(__dirname, '../.playwright/.auth/reviewer.json');

/**
 * Test Users Configuration
 *
 * These should match users in your test database.
 * For CI/CD, you can use environment variables:
 *   CREATOR_EMAIL, CREATOR_PASSWORD
 *   REVIEWER_EMAIL, REVIEWER_PASSWORD
 */
const TEST_USERS = {
  creator: {
    email: process.env.CREATOR_EMAIL || 'creator@test.com',
    password: process.env.CREATOR_PASSWORD || 'TestPassword123',
  },
  reviewer: {
    email: process.env.REVIEWER_EMAIL || 'reviewer@test.com',
    password: process.env.REVIEWER_PASSWORD || 'TestPassword123',
  },
};

/**
 * Setup: Authenticate as Creator
 * Saves authentication state for reuse in tests
 */
setup('authenticate as creator', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill in credentials
  await page.getByLabel(/email/i).fill(TEST_USERS.creator.email);
  await page.locator('input#password').fill(TEST_USERS.creator.password);

  // Submit login form and wait for navigation
  await Promise.all([
    page.waitForURL(/\/(dashboard|$)/, { timeout: 30000 }),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);

  // Verify we're logged in (not on login page)
  await expect(page).not.toHaveURL(/\/login/);

  // Save authentication state
  await page.context().storageState({ path: CREATOR_AUTH_FILE });
});

/**
 * Setup: Authenticate as Reviewer
 * Saves authentication state for reuse in tests
 */
setup('authenticate as reviewer', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill in credentials
  await page.getByLabel(/email/i).fill(TEST_USERS.reviewer.email);
  await page.locator('input#password').fill(TEST_USERS.reviewer.password);

  // Submit login form and wait for navigation
  await Promise.all([
    page.waitForURL(/\/(dashboard|$)/, { timeout: 30000 }),
    page.getByRole('button', { name: /sign in/i }).click(),
  ]);

  // Verify we're logged in (not on login page)
  await expect(page).not.toHaveURL(/\/login/);

  // Save authentication state
  await page.context().storageState({ path: REVIEWER_AUTH_FILE });
});

export { CREATOR_AUTH_FILE, REVIEWER_AUTH_FILE, TEST_USERS };
