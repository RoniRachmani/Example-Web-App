import { test, expect } from './fixtures.js';

// WCAG contrast ratio of a CSS colour over an opaque background colour.
function contrast(foreground, background) {
  const parse = css => css.match(/[\d.]+/g).map(Number);
  const [fr, fg, fb, alpha = 1] = parse(foreground);
  const bg = parse(background);
  const blended = [fr, fg, fb].map((c, i) => c * alpha + bg[i] * (1 - alpha));
  const luminance = rgb => {
    const [r, g, b] = rgb.map(c => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [light, dark] = [luminance(blended), luminance(bg)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

test.describe('pages', () => {
  test('shows a loading status and navigation while the initial article request is pending', async ({ page }) => {
    const warnings = [];
    page.on('console', message => {
      if (message.type() === 'warning') warnings.push(message.text());
    });
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    await page.route('**/api/articles/learn-react', async route => {
      await pending;
      await route.fallback();
    });
    try {
      await page.goto('/articles/learn-react');
      await expect(page.getByRole('status')).toHaveText('Loading Blogify…');
      await expect(page.locator('nav').getByRole('link', { name: 'Home' })).toBeVisible();
    } finally {
      release();
    }
    await expect(page.getByRole('heading', { name: 'The Fastest Way to Learn React' })).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    expect(warnings.filter(message => message.includes('HydrateFallback'))).toEqual([]);
  });

  for (const colorScheme of ['dark', 'light']) {
    test(`auth controls have readable text and visible toggle borders in ${colorScheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/login');
      for (const button of [page.getByRole('button', { name: 'Log In', exact: true }), page.getByRole('button', { name: 'Show password' })]) {
        const colors = await button.evaluate(element => {
          const style = getComputedStyle(element);
          return { text: style.color, background: style.backgroundColor, border: style.borderColor };
        });
        expect(contrast(colors.text, colors.background)).toBeGreaterThanOrEqual(4.5);
        if (await button.getAttribute('aria-pressed')) {
          expect(contrast(colors.border, colors.background)).toBeGreaterThanOrEqual(3);
        }
      }
    });

    test(`article previews are readable in ${colorScheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/articles');

      const background = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
      const link = page.locator('a.article-link').first();
      for (const element of [link.locator('h3'), link.locator('p').first(), link.locator('p.article-details')]) {
        const color = await element.evaluate(e => getComputedStyle(e).color);
        expect(contrast(color, background), `${color} on ${background}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  for (const colorScheme of ['dark', 'light']) {
    test(`links are readable in ${colorScheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/');

      const background = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
      for (const element of [page.getByRole('link', { name: 'Create a free account' }), page.getByRole('button', { name: 'Cookie settings' })]) {
        const color = await element.evaluate(e => getComputedStyle(e).color);
        expect(contrast(color, background), `${color} on ${background}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  test('a broken link still shows the nav bar and a way back to the articles', async ({ page }) => {
    await page.goto('/articles/no-such-article');

    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
    await expect(page.locator('nav').getByRole('link', { name: 'Home' })).toBeVisible();
    await page.getByRole('link', { name: 'Browse the articles' }).click();
    await expect(page).toHaveURL(/\/articles$/);
  });

  test('the first Tab stop skips to the page content', async ({ page }) => {
    await page.goto('/about');
    await page.keyboard.press('Tab');

    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
  });

  test('lists each article with its reading time, upvotes and comments', async ({ page, api }) => {
    api.db.docs[0].upvotes = 1;
    api.db.docs[0].comments = [{ uid: 'u1', postedBy: 'Alice', text: 'one' }, { uid: 'u2', postedBy: 'Bob', text: 'two' }];
    await page.goto('/articles');

    const details = page.locator('a.article-link p.article-details');
    await expect(details).toHaveCount(3);
    await expect(details.first()).toHaveText(/^\d+ min read · 1 upvote · 2 comments$/);
    // Not in the database yet, so there are no counts to show
    await expect(details.nth(1)).toHaveText(/^\d+ min read$/);
  });

  test('still lists the articles when the counts cannot be loaded', async ({ page }) => {
    await page.route('**/api/articles', route => route.fulfill({ status: 500 }));
    await page.goto('/articles');

    await expect(page.locator('a.article-link')).toHaveCount(3);
    await expect(page.locator('a.article-link p.article-details').first()).toHaveText(/^\d+ min read$/);
  });

  test('the home page leads with the most upvoted articles and links to the rest', async ({ page, api }) => {
    api.db.docs.push({ name: 'mongodb', upvotes: 5, upvoteIds: [], comments: [] });
    await page.goto('/');

    await expect(page.locator('a.article-link h3')).toHaveText(['Learn MongoDB', 'The Fastest Way to Learn React']);
    await page.getByRole('link', { name: 'See all 3 articles' }).click();
    await expect(page.locator('a.article-link')).toHaveCount(3);
  });

  test('previews end on a whole word', async ({ page }) => {
    await page.goto('/articles');

    for (const text of await page.locator('a.article-link p:not(.article-details)').allTextContents()) {
      expect(text.length).toBeLessThanOrEqual(151);
      expect(text).toMatch(/\S…$/);
      expect(text).not.toMatch(/ …$/);
    }
  });

  test('each page has its own title', async ({ page }) => {
    const titles = {
      '/': 'Blogify | Read. Write. React.',
      '/about': 'About | Blogify',
      '/articles': 'Articles | Blogify',
      '/articles/learn-react': 'The Fastest Way to Learn React | Blogify',
      '/login': 'Log In | Blogify',
      '/create-account': 'Create Account | Blogify',
      '/no-such-page': 'Page Not Found | Blogify',
    };

    for (const [path, title] of Object.entries(titles)) {
      await page.goto(path);
      await expect(page, path).toHaveTitle(title);
    }
  });

  test('says "1 upvote", not "1 upvotes"', async ({ page, api }) => {
    api.db.docs[0].upvotes = 1;
    await page.goto('/articles/learn-react');
    await expect(page.getByText('This article has 1 upvote', { exact: true })).toBeVisible();
  });
});
