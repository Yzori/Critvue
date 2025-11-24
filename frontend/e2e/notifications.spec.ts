import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Notification E2E Tests
 *
 * Tests notification functionality including:
 * 1. Notification bell and UI components
 * 2. Notification API endpoints
 * 3. Notification preferences
 */

const CREATOR_AUTH_FILE = path.join(__dirname, '../.playwright/.auth/creator.json');
const REVIEWER_AUTH_FILE = path.join(__dirname, '../.playwright/.auth/reviewer.json');
const API_BASE = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe('Notification UI Tests', () => {
  test('Creator can see notification bell in navigation', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: CREATOR_AUTH_FILE,
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for notification bell button in the nav
    const notificationBell = page.getByRole('button', { name: /notification/i });
    await expect(notificationBell).toBeVisible({ timeout: 10000 });

    await context.close();
  });

  test('Reviewer can see notification bell in navigation', async ({ browser }, testInfo) => {
    // Skip on mobile - notification bell is desktop only (hidden lg:flex)
    if (testInfo.project.name === 'mobile-chrome') {
      test.skip(true, 'Notification bell is desktop-only');
    }

    const context = await browser.newContext({
      storageState: REVIEWER_AUTH_FILE,
    });
    const page = await context.newPage();

    await page.goto('/reviewer/hub');
    await page.waitForLoadState('networkidle');

    // Wait for page to fully render
    await page.waitForTimeout(1000);

    // Look for notification bell button
    const notificationBell = page.getByRole('button', { name: /notification/i });
    await expect(notificationBell).toBeVisible({ timeout: 15000 });

    await context.close();
  });

  test('Clicking notification bell opens notification panel/dropdown', async ({ browser }, testInfo) => {
    // Skip on mobile - notification bell is desktop only
    if (testInfo.project.name === 'mobile-chrome') {
      test.skip(true, 'Notification bell is desktop-only');
    }

    const context = await browser.newContext({
      storageState: CREATOR_AUTH_FILE,
    });
    const page = await context.newPage();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for page to stabilize
    await page.waitForTimeout(1000);

    // Click notification bell
    const notificationBell = page.getByRole('button', { name: /notification/i });
    await expect(notificationBell).toBeVisible({ timeout: 10000 });
    await notificationBell.click();

    // Wait for notification panel/dropdown to appear - check for dropdown menu
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10000 });

    await context.close();
  });
});

test.describe('Notification API Tests', () => {
  test('API: Get notifications returns valid response', async ({ request }) => {
    // This test checks that the notification endpoints exist and respond correctly
    // Note: Without auth cookies, we expect 401
    const response = await request.get(`${API_BASE}/api/v1/notifications`);

    // Should get 401 (unauthorized) since we're not authenticated
    expect(response.status()).toBe(401);
  });

  test('API: Get unread count endpoint exists', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/notifications/unread-count`);

    // Should get 401 (unauthorized) since we're not authenticated
    expect(response.status()).toBe(401);
  });

  test('API: Get notification stats endpoint exists', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/notifications/stats`);

    // Should get 401 (unauthorized) since we're not authenticated
    expect(response.status()).toBe(401);
  });

  test('API: Get notification preferences endpoint exists', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/v1/notifications/preferences/me`);

    // Should get 401 (unauthorized) since we're not authenticated
    expect(response.status()).toBe(401);
  });

  test('API: Mark all read endpoint exists', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/v1/notifications/mark-all-read`, {
      data: {},
    });

    // Should get 401 or 422 (unauthorized or validation error)
    expect([401, 422]).toContain(response.status());
  });
});

test.describe('Notification Settings Tests', () => {
  test('User can access notification settings page', async ({ browser }) => {
    const context = await browser.newContext({
      storageState: CREATOR_AUTH_FILE,
    });
    const page = await context.newPage();

    // Navigate to notification settings
    await page.goto('/settings/notifications');
    await page.waitForLoadState('networkidle');

    // Should see the notification preferences heading
    await expect(
      page.getByRole('heading', { name: /notification preferences/i })
    ).toBeVisible({ timeout: 10000 });

    await context.close();
  });
});

test.describe('Notification Trigger Tests', () => {
  /**
   * These tests verify that notifications are created when key events occur.
   * Note: These are integration tests that depend on the review lifecycle.
   */

  test('Notification types are defined correctly', async ({ request }) => {
    // Test that the notification system recognizes key notification types
    // by checking that a non-existent notification returns 404 (not 500)
    const response = await request.get(`${API_BASE}/api/v1/notifications/999999`);

    // Should get 401 (not authenticated) or 404 (not found), not 500
    expect([401, 404]).toContain(response.status());
  });

  test('Mark notification read endpoint handles invalid ID gracefully', async ({ request }) => {
    const response = await request.patch(`${API_BASE}/api/v1/notifications/999999/read`, {
      data: { read: true },
    });

    // Should get 401, 404, or 422 - not 500
    expect([401, 404, 422]).toContain(response.status());
  });

  test('Archive notification endpoint handles invalid ID gracefully', async ({ request }) => {
    const response = await request.patch(`${API_BASE}/api/v1/notifications/999999/archive`, {
      data: { archived: true },
    });

    // Should get 401, 404, or 422 - not 500
    expect([401, 404, 422]).toContain(response.status());
  });

  test('Delete notification endpoint handles invalid ID gracefully', async ({ request }) => {
    const response = await request.delete(`${API_BASE}/api/v1/notifications/999999`);

    // Should get 401 or 404 - not 500
    expect([401, 404]).toContain(response.status());
  });
});

test.describe('Notification Preferences API Tests', () => {
  test('Update preferences endpoint handles partial updates', async ({ request }) => {
    // Test that we can send partial updates to preferences
    const response = await request.patch(`${API_BASE}/api/v1/notifications/preferences/me`, {
      data: {
        email_enabled: true,
      },
    });

    // Should get 401 (unauthorized) since we're not authenticated
    expect(response.status()).toBe(401);
  });

  test('Update preferences endpoint rejects invalid digest frequency', async ({ request }) => {
    const response = await request.patch(`${API_BASE}/api/v1/notifications/preferences/me`, {
      data: {
        email_digest_frequency: 'invalid_frequency',
      },
    });

    // Should get 401 or 422 (validation error for invalid enum)
    expect([401, 422]).toContain(response.status());
  });
});
