import { test, expect, logIn } from './fixtures.js';

const account = { email: 'alice@example.com', password: 'password123' };

async function openArticleSignedIn(page, firebase) {
  firebase.addAccount(account);
  await logIn(page, account);
  await page.goto('/articles/learn-react');
}

test.describe('upvote button', () => {
  test('is hidden from signed-out visitors', async ({ page }) => {
    await page.goto('/articles/learn-react');

    await expect(page.getByText('This article has 0 upvotes')).toBeVisible();
    await expect(page.getByRole('button', { name: /Upvote/ })).toHaveCount(0);
  });

  test('counts one upvote, then shows it was counted, even after a reload', async ({ page, firebase }) => {
    await openArticleSignedIn(page, firebase);

    await page.getByRole('button', { name: 'Upvote' }).click();

    await expect(page.getByText('This article has 1 upvote', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upvoted' })).toBeDisabled();

    await page.reload();
    await expect(page.getByRole('button', { name: 'Upvoted' })).toBeDisabled();
    await expect(page.getByText('This article has 1 upvote', { exact: true })).toBeVisible();
  });

  test('shows an upvote made in another tab as counted, without an error', async ({ page, firebase, api }) => {
    await openArticleSignedIn(page, firebase);
    await expect(page.getByRole('button', { name: 'Upvote' })).toBeEnabled();
    // As if the other tab had upvoted after this page loaded
    api.db.docs[0].upvotes = 1;
    api.db.docs[0].upvoteIds = [firebase.account(account.email).uid];

    await page.getByRole('button', { name: 'Upvote' }).click();

    await expect(page.getByRole('button', { name: 'Upvoted' })).toBeDisabled();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('says why when an upvote fails, and lets the user try again', async ({ page, firebase }) => {
    await openArticleSignedIn(page, firebase);
    await page.route('**/api/articles/learn-react/upvote', route => route.fulfill({ status: 401, body: 'Unauthorized' }));

    await page.getByRole('button', { name: 'Upvote' }).click();

    await expect(page.getByRole('alert')).toHaveText("Your upvote couldn't be saved. Your sign-in has expired, so please log in again.");
    await expect(page.getByRole('button', { name: 'Upvote' })).toBeEnabled();
    await expect(page.getByText('This article has 0 upvotes')).toBeVisible();
  });
});
