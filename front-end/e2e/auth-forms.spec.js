import { test, expect, fillSignUpForm } from './fixtures.js';

const account = { email: 'alice@example.com', password: 'password123' };

test.describe('log-in and sign-up forms', () => {
  test('logs in when Enter is pressed in the password field', async ({ page, firebase }) => {
    firebase.addAccount(account);
    await page.goto('/login');

    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByLabel('Password', { exact: true }).press('Enter');

    await expect(page).toHaveURL(/\/articles$/);
    await expect(page.getByRole('button', { name: 'Log Out' })).toBeVisible();
  });

  test('says the email or password is wrong, without Firebase error codes', async ({ page, firebase }) => {
    firebase.addAccount(account);
    await page.goto('/login');

    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill('wrong password');
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
    await expect(page.getByLabel('Password', { exact: true })).toHaveAccessibleDescription('Please enter your password.');
    await expect(email).toBeFocused();
    expect(firebase.calls).not.toContain('accounts:signInWithPassword');
  });

  test('rejects a malformed email before asking Firebase', async ({ page, firebase }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('alice');
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByLabel('Email')).toHaveAccessibleDescription('Please enter a valid email address.');
    expect(firebase.calls).not.toContain('accounts:signInWithPassword');
  });

  test('returns to the article after logging in from its comment prompt', async ({ page, firebase }) => {
    firebase.addAccount(account);
    await page.goto('/articles/learn-react');

    await page.getByText('Log in to add a comment').getByRole('link', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('You’ll return here after logging in.', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to article' })).toHaveAttribute('href', '/articles/learn-react#comments');
    await page.getByRole('link', { name: 'Forgot your password?' }).click();
    await page.getByRole('link', { name: 'Back to log in' }).click();
    await expect(page).toHaveTitle('Log In | Blogify');
    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page).toHaveURL(/\/articles\/learn-react#comments$/);
    await expect(page.locator('#comments')).toBeFocused();
    await expect(page.getByLabel('Comment', { exact: true })).toBeVisible();
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
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('autocomplete', 'current-password');

    await page.goto('/create-account');
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('autocomplete', 'new-password');
    await expect(page.getByLabel('Confirm password', { exact: true })).toHaveAttribute('autocomplete', 'new-password');
  });

  test('says when an account already exists for the email', async ({ page, firebase }) => {
    firebase.addAccount(account);

    await fillSignUpForm(page, { displayName: 'Alice', email: account.email });
    await page.getByLabel('Confirm password', { exact: true }).press('Enter');

    await expect(page.getByRole('alert')).toHaveText('An account with this email already exists. Try logging in instead.');
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeEnabled();
  });
});


test('preserves article context through signup and returns to comments', async ({ page }) => {
  await page.goto('/articles/learn-react');
  await page.getByText('Log in to add a comment').getByRole('link').click();
  await page.getByRole('link', { name: "Don't have an account? Create one here" }).click();
  await expect(page.getByText('You’ll return here after signing up.', { exact: false })).toBeVisible();
  await page.getByLabel('Display name').fill('New reader');
  await page.getByLabel('Email').fill('reader@example.com');
  await page.getByLabel('Password', { exact: true }).fill('secret123');
  await page.getByLabel('Confirm password', { exact: true }).fill('secret123');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'Show password', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(page).toHaveURL(/learn-react#comments$/);
  await expect(page.locator('#comments')).toBeFocused();
  await expect(page.getByLabel('Comment', { exact: true })).toBeVisible();
});
