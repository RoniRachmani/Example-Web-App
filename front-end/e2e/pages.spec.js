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
  for (const colorScheme of ['dark', 'light']) {
    test(`article previews are readable in ${colorScheme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/articles');

      const background = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
      const link = page.locator('a.article-link').first();
      for (const element of [link.locator('h3'), link.locator('p')]) {
        const color = await element.evaluate(e => getComputedStyle(e).color);
        expect(contrast(color, background), `${color} on ${background}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }

  test('previews end on a whole word', async ({ page }) => {
    await page.goto('/articles');

    for (const text of await page.locator('a.article-link p').allTextContents()) {
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
