import { test, expect, fillSignUpForm, postComment } from './fixtures.js';

test.describe('sign-up display name', () => {
  test('rejects a blank name without creating an account', async ({ page, firebase }) => {
    await fillSignUpForm(page, { displayName: '    ' });
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Please enter a display name.')).toBeVisible();
    expect(firebase.calls).not.toContain('accounts:signUp');
    await expect(page).toHaveURL(/\/create-account$/);
  });

  test('rejects a name over 50 characters without creating an account', async ({ page, firebase }) => {
    await fillSignUpForm(page, { displayName: 'x'.repeat(51) });
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Display names can be at most 50 characters.')).toBeVisible();
    expect(firebase.calls).not.toContain('accounts:signUp');
  });

  test('still requires matching passwords', async ({ page, firebase }) => {
    await fillSignUpForm(page, { displayName: 'Bob', confirmPassword: 'different' });
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Password and Confirm Password do not match!')).toBeVisible();
    expect(firebase.calls).not.toContain('accounts:signUp');
  });

  test('saves the trimmed name, shows it in the nav and on the first comment', async ({ page, firebase, api }) => {
    await fillSignUpForm(page, { displayName: '  Bob Jones  ' });
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/articles$/);
    await expect(page.locator('nav')).toContainText('Logged in as Bob Jones');
    expect(firebase.account('bob@example.com').displayName).toBe('Bob Jones');

    await postComment(page, 'learn-react', 'First!');

    await expect(page.getByRole('heading', { name: 'Bob Jones' })).toBeVisible();
    expect(api.posted).toHaveLength(1);
    expect(api.posted[0].claims.name).toBe('Bob Jones');
  });

  // Guards the forced token refresh in saveDisplayName: without it, the first
  // comment would go out with a token that has no name claim.
  test('gets the name into the token even if Firebase returns no new token on update', async ({ page, firebase, api }) => {
    firebase.profileUpdateReturnsToken = false;

    await fillSignUpForm(page, { displayName: 'Bob Jones' });
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.locator('nav')).toContainText('Logged in as Bob Jones');

    await postComment(page, 'learn-react', 'First!');

    await expect(page.getByRole('heading', { name: 'Bob Jones' })).toBeVisible();
    expect(api.posted[0].claims.name).toBe('Bob Jones');
  });

  test('sends the user to the profile page if the name could not be saved', async ({ page, firebase }) => {
    firebase.failProfileUpdate = true;

    await fillSignUpForm(page, { displayName: 'Bob Jones' });
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByText("Your account was created, but your display name couldn't be saved. Please set it here.")).toBeVisible();
    await expect(page.locator('nav')).toContainText('Logged in as bob@example.com');

    // Setting the name there works once Firebase recovers.
    firebase.failProfileUpdate = false;
    await page.getByLabel('Display name').fill('Bob Jones');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Display name saved.')).toBeVisible();
    await expect(page.locator('nav')).toContainText('Logged in as Bob Jones');
  });
});
