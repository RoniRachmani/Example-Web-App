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
    firebase.addAccount({ ...account, displayName: 'Alice' });
    await logIn(page, account);
    await page.goto('/articles/learn-react');
    await expect(page.getByText('No comments yet.')).toBeVisible();

    await page.getByLabel('Comment').fill('  Great article!  ');
    await page.getByRole('button', { name: 'Add Comment' }).click();

    await expect(page.getByRole('heading', { name: 'Alice' })).toBeVisible();
    await expect(page.getByText('Great article!')).toBeVisible();
    await expect(page.getByText('No comments yet.')).toHaveCount(0);
    await expect(page.getByLabel('Comment')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Add Comment' })).toBeDisabled();
    expect(api.posted).toEqual([expect.objectContaining({ postedBy: 'Alice', text: 'Great article!' })]);
  });

  test("shows Anonymous, never the email, for a user without a display name", async ({ page, firebase, api }) => {
    await openArticleSignedIn(page, firebase);

    await page.getByLabel('Comment').fill('Hello');
    await page.getByRole('button', { name: 'Add Comment' }).click();

    await expect(page.getByRole('heading', { name: 'Anonymous' })).toBeVisible();
    await expect(page.locator('main')).not.toContainText('alice@example.com');
    expect(api.posted).toEqual([expect.objectContaining({ postedBy: 'Anonymous', text: 'Hello' })]);
  });

  test('shows two identical comments as two comments', async ({ page, firebase }) => {
    await openArticleSignedIn(page, firebase);

    for (const count of [1, 2]) {
      await page.getByLabel('Comment').fill('Great article!');
      await page.getByRole('button', { name: 'Add Comment' }).click();
      await expect(page.getByText('Great article!')).toHaveCount(count);
    }

    await page.reload();
    await expect(page.getByText('Great article!')).toHaveCount(2);
  });

  test('keeps the text and says why when a comment fails to post', async ({ page, firebase, api }) => {
    await openArticleSignedIn(page, firebase);
    await page.route('**/api/articles/learn-react/comments', route => route.fulfill({ status: 429, body: 'Too Many Requests' }));

    await page.getByLabel('Comment').fill('Please keep me');
    await page.getByRole('button', { name: 'Add Comment' }).click();

    await expect(page.getByRole('alert')).toHaveText("Your comment couldn't be posted. You're doing that too often, so please wait a few minutes.");
    await expect(page.getByLabel('Comment')).toHaveValue('Please keep me');
    await expect(page.getByRole('button', { name: 'Add Comment' })).toBeEnabled();
    expect(api.posted).toHaveLength(0);

    // Posting works again once the server accepts it, and the message goes away.
    await page.unroute('**/api/articles/learn-react/comments');
    await page.getByRole('button', { name: 'Add Comment' }).click();
    await expect(page.getByText('Please keep me', { exact: true }).last()).toBeVisible();
    await expect(page.getByLabel('Comment')).toHaveValue('');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('keeps line breaks and wraps a long word instead of overflowing', async ({ page, firebase }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await openArticleSignedIn(page, firebase);

    await page.getByLabel('Comment').fill('first line\nsecond line');
    await page.getByRole('button', { name: 'Add Comment' }).click();
    // innerText is the text as laid out: a collapsed line break would be a space
    await expect.poll(() => page.locator('.comment p').last().evaluate(p => p.innerText)).toBe('first line\nsecond line');

    await page.getByLabel('Comment').fill('x'.repeat(300));
    await page.getByRole('button', { name: 'Add Comment' }).click();
    await expect(page.getByText('x'.repeat(300))).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
});
