import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/NFL/i);
  await expect(page.locator('main')).toBeVisible();
});

test('login page reachable', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
});

test('pricing page lists Pro tier', async ({ page }) => {
  await page.goto('/preise');
  await expect(page.getByText(/7,90|7\.90/)).toBeVisible();
});
