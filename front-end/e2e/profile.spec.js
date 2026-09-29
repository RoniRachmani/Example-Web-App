import { test, expect, logIn } from './fixtures.js';

const alice = { email: 'alice@example.com', password: 'password123' };

test.describe('profile page', () => {
  test('asks signed-out visitors to log in, with no Profile link in the nav', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.getByText('Log in to edit your profile.')).toBeVisible();
    await expect(page.locator('nav').getByRole('link', { name: 'Profile' })).toHaveCount(0);
  });

  test('saves a display name and updates the nav without a reload', async ({ page, firebase }) => {
    firebase.addAccount(alice);
    await logIn(page, alice);
    await expect(page.locator('nav')).toContainText('Logged in as alice@example.com');

    await page.locator('nav').getByRole('link', { name: 'Profile' }).click();
    await expect(page.getByText('Signed in as alice@example.com')).toBeVisible();

    // Survives only as long as the page isn't reloaded.
    await page.evaluate(() => { window.notReloaded = true; });

    await page.getByLabel('Display name').fill('  Alice Smith  ');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Display name saved.')).toBeVisible();
    await expect(page.getByLabel('Display name')).toHaveValue('Alice Smith');
    await expect(page.locator('nav')).toContainText('Logged in as Alice Smith');
    expect(await page.evaluate(() => window.notReloaded)).toBe(true);
    expect(firebase.account(alice.email).displayName).toBe('Alice Smith');

    await page.reload();
    await expect(page.locator('nav')).toContainText('Logged in as Alice Smith');

    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.locator('nav')).not.toContainText('Logged in as');
  });

  test('rejects a blank name and keeps the current one', async ({ page, firebase }) => {
    firebase.addAccount({ ...alice, displayName: 'Alice Smith' });
    await logIn(page, alice);
    await page.goto('/profile');
    await expect(page.getByLabel('Display name')).toHaveValue('Alice Smith');

    await page.getByLabel('Display name').fill('   ');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Please enter a display name.')).toBeVisible();
    await expect(page.locator('nav')).toContainText('Logged in as Alice Smith');
    expect(firebase.calls).not.toContain('accounts:update');
  });
});
