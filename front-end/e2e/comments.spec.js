import { test, expect, logIn } from './fixtures.js';

const account = { email: 'alice@example.com', password: 'password123' };

async function openArticleSignedIn(page, firebase) {
  firebase.addAccount(account);
  await logIn(page, account);
  await page.goto('/articles/learn-react');
}

test.describe('comment form', () => {
  test('asks signed-out visitors to log in instead of showing the form', async ({ page }) => {
    await page.goto('/articles/learn-react');

    await expect(page.getByText('Log in to add a comment')).toBeVisible();
    await expect(page.getByLabel('Comment')).toHaveCount(0);
  });

  test('keeps the button disabled for an empty or whitespace-only comment', async ({ page, firebase }) => {
    await openArticleSignedIn(page, firebase);
    const button = page.getByRole('button', { name: 'Add Comment' });

    await expect(button).toBeDisabled();
    await page.getByLabel('Comment').fill('    ');
    await expect(button).toBeDisabled();
  });

  test('allows 1000 characters and blocks 1001 with a message', async ({ page, firebase, api }) => {
    await openArticleSignedIn(page, firebase);
    const input = page.getByLabel('Comment');
    const button = page.getByRole('button', { name: 'Add Comment' });

    await input.fill('x'.repeat(1000));
    await expect(button).toBeEnabled();
    await expect(page.getByText(/Comments can be at most/)).toHaveCount(0);

    await input.fill('x'.repeat(1001));
    await expect(page.getByText('Comments can be at most 1000 characters (1001 now).')).toBeVisible();
    await expect(button).toBeDisabled();
    expect(api.posted).toHaveLength(0);
  });

  test('counts an emoji as one character, like the server', async ({ page, firebase, api }) => {
    await openArticleSignedIn(page, firebase);
    // 1000 characters, but 2000 UTF-16 units, which an input's maxLength would count.
    const emoji = '😀'.repeat(1000);

    await page.getByLabel('Comment').fill(emoji);
    await expect(page.getByText(/Comments can be at most/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Add Comment' }).click();

    await expect.poll(() => api.posted.length).toBe(1);
    expect(api.posted[0].text).toBe(emoji);
  });

  test('posts the comment under the author, then clears the form', async ({ page, firebase, api }) => {
    await openArticleSignedIn(page, firebase);

    await page.getByLabel('Comment').fill('  Great article!  ');
    await page.getByRole('button', { name: 'Add Comment' }).click();

    await expect(page.getByRole('heading', { name: 'alice@example.com' })).toBeVisible();
    await expect(page.getByText('Great article!')).toBeVisible();
    await expect(page.getByLabel('Comment')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Add Comment' })).toBeDisabled();
    expect(api.posted).toEqual([expect.objectContaining({ postedBy: 'alice@example.com', text: 'Great article!' })]);
  });
});
