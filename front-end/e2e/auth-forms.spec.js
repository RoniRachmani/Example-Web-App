import { test, expect, fillSignUpForm } from './fixtures.js';

const account = { email: 'alice@example.com', password: 'password123' };

test.describe('log-in and sign-up forms', () => {
  test('logs in when Enter is pressed in the password field', async ({ page, firebase }) => {
    firebase.addAccount(account);
    await page.goto('/login');

    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password').fill(account.password);
    await page.getByLabel('Password').press('Enter');

    await expect(page).toHaveURL(/\/articles$/);
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  });

  test('says the email or password is wrong, without Firebase error codes', async ({ page, firebase }) => {
    firebase.addAccount(account);
    await page.goto('/login');

    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password').fill('wrong password');
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByRole('alert')).toHaveText('Incorrect email or password.');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('helps the browser and password managers fill the fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toHaveAttribute('type', 'email');
    await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'email');
    await expect(page.getByLabel('Password')).toHaveAttribute('autocomplete', 'current-password');

    await page.goto('/create-account');
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('autocomplete', 'new-password');
    await expect(page.getByLabel('Confirm password')).toHaveAttribute('autocomplete', 'new-password');
  });

  test('says when an account already exists for the email', async ({ page, firebase }) => {
    firebase.addAccount(account);

    await fillSignUpForm(page, { displayName: 'Alice', email: account.email });
    await page.getByLabel('Confirm password').press('Enter');

    await expect(page.getByRole('alert')).toHaveText('An account with this email already exists. Try logging in instead.');
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeEnabled();
  });
});
