import fs from 'fs';
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// Claude Code on the web has a Chromium preinstalled that may not match this
// Playwright version, and can't download another. Elsewhere (and in CI),
// `npx playwright install chromium` provides the right one.
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium';
const executablePath = process.env.CLAUDE_CODE_REMOTE === 'true' && fs.existsSync(PREINSTALLED_CHROMIUM)
  ? PREINSTALLED_CHROMIUM
  : undefined;

export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } },
  }],
  // Tests run against the production build. Firebase and the /api routes are
  // faked in the browser (see e2e/fixtures.js), so no back end or secrets are needed.
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
