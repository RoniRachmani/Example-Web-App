import { test, expect } from './fixtures.js';

// Hosts Firebase Analytics talks to as it starts and collects
const ANALYTICS_HOST = /googletagmanager\.com|google-analytics\.com|firebaseinstallations\.googleapis\.com|firebase\.googleapis\.com/;

function trackAnalyticsRequests(page) {
  const requests = [];
  page.on('request', request => {
    if (ANALYTICS_HOST.test(new URL(request.url()).hostname)) requests.push(request.url());
  });
  return requests;
}

test.describe('analytics consent', () => {
  test("doesn't load Analytics until the visitor accepts, then remembers", async ({ page }) => {
    const requests = trackAnalyticsRequests(page);
    await page.goto('/');
    const banner = page.getByRole('complementary', { name: 'Cookie consent' });
    await expect(banner).toBeVisible();

    await page.goto('/articles');
    expect(requests).toEqual([]);

    await banner.getByRole('button', { name: 'Accept' }).click();
    await expect(banner).toHaveCount(0);
    await expect.poll(() => requests.length).toBeGreaterThan(0);

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Articles' })).toBeVisible();
    await expect(banner).toHaveCount(0);
  });

  test('never loads Analytics for a visitor who declines', async ({ page }) => {
    const requests = trackAnalyticsRequests(page);
    await page.goto('/');

    await page.getByRole('button', { name: 'Decline' }).click();
    await expect(page.getByRole('complementary', { name: 'Cookie consent' })).toHaveCount(0);

    await page.reload();
    await page.goto('/articles/learn-react');
    await expect(page.getByRole('heading', { name: 'The Fastest Way to Learn React' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Cookie consent' })).toHaveCount(0);
    expect(requests).toEqual([]);
  });

  test('lets the visitor change their mind from the footer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Decline' }).click();

    await page.getByRole('button', { name: 'Cookie settings' }).click();

    await expect(page.getByRole('complementary', { name: 'Cookie consent' })).toBeVisible();
  });
});
