import fs from 'fs';
import { defineConfig, devices } from '@playwright/test';

// Not 4173, where `npm run preview` listens: the tests must never reuse a server
// left running from an older build.
const PORT = 4179;

// Claude Code on the web has a Chromium preinstalled that may not match this
// Playwright version, and can't download another. Elsewhere (and in CI),
// `npx playwright install chromium` provides the right one.
const PREINSTALLED_BROWSERS = '/opt/pw-browsers';
const PREINSTALLED_CHROMIUM = `${PREINSTALLED_BROWSERS}/chromium`;
const usePreinstalled = process.env.CLAUDE_CODE_REMOTE === 'true' && fs.existsSync(PREINSTALLED_CHROMIUM);

// Workers load this config too; the env var (inherited by them) keeps the warning to one.
if (usePreinstalled && !process.env.PW_PREINSTALLED_CHECKED) {
  process.env.PW_PREINSTALLED_CHECKED = '1';
  // Say so when the preinstalled build isn't the one this Playwright was made for,
  // since results can then differ from CI, which installs the matching build.
  const { browsers } = JSON.parse(fs.readFileSync(new URL('./node_modules/playwright-core/browsers.json', import.meta.url)));
  const expected = browsers.find(b => b.name === 'chromium').revision;
  if (!fs.existsSync(`${PREINSTALLED_BROWSERS}/chromium-${expected}`)) {
    const installed = fs.readdirSync(PREINSTALLED_BROWSERS).find(name => /^chromium-\d+$/.test(name)) ?? 'an unknown build';
    console.warn(`Using the preinstalled ${installed}, but this Playwright expects chromium-${expected}. CI runs the matching build, so trust CI if results differ.`);
  }
}

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Saved to test-results/, which CI uploads when a test fails
    trace: 'retain-on-failure',
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: usePreinstalled ? PREINSTALLED_CHROMIUM : undefined } },
  }],
  // Tests run against the production build. Firebase is faked in the browser and
  // /api goes to the real back end with an in-memory database (see e2e/fixtures.js),
  // so no MongoDB, Firebase project or secrets are needed.
  webServer: {
    // CI has just built dist in its own step, so only build here when running locally.
    command: `${process.env.CI ? '' : 'npm run build && '}npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
