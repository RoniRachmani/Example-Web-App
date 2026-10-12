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
    await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible();
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

  test('points out empty fields next to them, without asking Firebase', async ({ page, firebase }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Log In' }).click();

    const email = page.getByLabel('Email');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAccessibleDescription('Please enter your email address.');
    await expect(page.getByLabel('Password')).toHaveAccessibleDescription('Please enter your password.');
    await expect(email).toBeFocused();
    expect(firebase.calls).not.toContain('accounts:signInWithPassword');
  });

  test('rejects a malformed email before asking Firebase', async ({ page, firebase }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('alice');
    await page.getByLabel('Password').fill(account.password);
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByLabel('Email')).toHaveAccessibleDescription('Please enter a valid email address.');
    expect(firebase.calls).not.toContain('accounts:signInWithPassword');
  });

  test('returns to the article after logging in from its comment prompt', async ({ page, firebase }) => {
    firebase.addAccount(account);
    await page.goto('/articles/learn-react');

    await page.getByText('Log in to add a comment').getByRole('link', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password').fill(account.password);
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page).toHaveURL(/\/articles\/learn-react$/);
    await expect(page.getByLabel('Comment')).toBeVisible();
  });

  test('shows every sign-up problem at once and states the password rule up front', async ({ page, firebase }) => {
    await page.goto('/create-account');
    await expect(page.getByLabel('Password', { exact: true })).toHaveAccessibleDescription('At least 6 characters.');

    await page.getByLabel('Password', { exact: true }).fill('abc');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Please enter a display name.')).toBeVisible();
    await expect(page.getByText('Please enter your email address.')).toBeVisible();
    await expect(page.getByText('Passwords must be at least 6 characters.')).toBeVisible();
    await expect(page.getByLabel('Display name')).toBeFocused();
    expect(firebase.calls).not.toContain('accounts:signUp');
  });

  test('sends a password reset link from the log-in page', async ({ page, firebase }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Forgot your password?' }).click();
    await expect(page).toHaveTitle('Reset Password | Blogify');

    await page.getByRole('button', { name: 'Send Reset Link' }).click();
    await expect(page.getByLabel('Email')).toHaveAccessibleDescription('Please enter your email address.');
    expect(firebase.calls).not.toContain('accounts:sendOobCode');

    await page.getByLabel('Email').fill(account.email);
    await page.getByRole('button', { name: 'Send Reset Link' }).click();

    await expect(page.getByRole('status')).toHaveText("If there's an account for alice@example.com, we've emailed a link to reset its password.");
    expect(firebase.calls).toContain('accounts:sendOobCode');
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
