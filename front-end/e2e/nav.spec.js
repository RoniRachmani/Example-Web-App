import { test, expect, logIn } from './fixtures.js';

const account = { email: 'alice@example.com', password: 'password123' };

// Number of lines the "Logged in as ..." text is laid out on.
const userLineCount = page => page.locator('nav li.nav-user').evaluate(li => {
  const range = document.createRange();
  range.selectNodeContents(li);
  return new Set([...range.getClientRects()].map(rect => Math.round(rect.top))).size;
});

const pageScrollsSideways = page => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

test.describe('nav bar user item', () => {
  test('shows the email when the user has no display name', async ({ page, firebase }) => {
    firebase.addAccount(account);
    await logIn(page, account);

    await expect(page.locator('nav li.nav-user')).toHaveText('Logged in as alice@example.com');
  });

  test('keeps a short name on one line on desktop and on a phone', async ({ page, firebase }) => {
    firebase.addAccount({ ...account, displayName: 'Alice Smith' });
    await logIn(page, account);
    await expect(page.locator('nav li.nav-user')).toHaveText('Logged in as Alice Smith');

    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 720 });
      expect(await userLineCount(page), `lines at ${width}px`).toBe(1);
      expect(await pageScrollsSideways(page), `sideways scroll at ${width}px`).toBe(false);
    }
  });

  test('lines the user item up with the links beside it', async ({ page, firebase }) => {
    firebase.addAccount({ ...account, displayName: 'Alice Smith' });
    await logIn(page, account);
    await page.setViewportSize({ width: 1280, height: 720 });

    const middle = async locator => {
      const box = await locator.boundingBox();
      return box.y + box.height / 2;
    };
    const user = await middle(page.locator('nav li.nav-user'));
    const profile = await middle(page.locator('nav').getByRole('link', { name: 'Profile' }));
    expect(Math.abs(user - profile)).toBeLessThanOrEqual(1);
  });

  test('cuts a 50-character name with an ellipsis on a phone instead of overflowing', async ({ page, firebase }) => {
    firebase.addAccount({ ...account, displayName: 'Maximiliana Montgomery-Featherstonehaugh Wolfe III' });
    await logIn(page, account);
    await page.setViewportSize({ width: 375, height: 720 });

    const item = page.locator('nav li.nav-user');
    await expect(item).toHaveCSS('text-overflow', 'ellipsis');
    expect(await item.evaluate(li => li.scrollWidth > li.clientWidth)).toBe(true);
    expect(await userLineCount(page)).toBe(1);
    expect(await pageScrollsSideways(page)).toBe(false);
  });
});
