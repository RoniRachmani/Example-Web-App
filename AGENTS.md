# Repository Guidelines

## Project Structure & Module Organization

Blogify uses React/Vite, Express, MongoDB, and Firebase Authentication. Run commands in the relevant npm package.

- `front-end/src/`: React components, helpers, and CSS; route components live in `pages/`. Article text lives in `article-content.js`.
- `front-end/public/`: static assets; `front-end/e2e/`: Playwright tests and fixtures.
- `back-end/src/`: API routes in `app.js`, database connection in `db.js`, and startup in `server.js`.
- `back-end/test/`: API/helper tests and an in-memory database fake; `back-end/scripts/`: maintenance utilities.
- `.github/workflows/`: CI and automation. Production serves `back-end/dist/`.

## Build, Test, and Development Commands

Use Node 24 (`nvm use`), matching `.nvmrc` and CI. Run `npm ci` in both packages first.

| Directory | Command | Purpose |
| --- | --- | --- |
| `front-end/` | `npm run dev` | Start Vite on port 5173; proxy `/api` to port 8000. |
| `front-end/` | `npm run build` | Build into `dist/`. |
| `front-end/` | `npm run lint` | Run ESLint. |
| `front-end/` | `npm run test:e2e` | Build locally and run Chromium browser tests. |
| `back-end/` | `npm run dev` | Start the API with watch mode. |
| `back-end/` | `npm test` | Run Node's built-in test runner. |

Install Chromium once from `front-end/` with `npx playwright install chromium`.

## Coding Style & Naming Conventions

Follow `.editorconfig`: two-space indentation, UTF-8, LF endings, and a final newline. Use ES modules, function components, and `async/await`; match surrounding style. Name components in PascalCase (`ArticlesList.jsx`) and helpers in camelCase (`displayName.js`). ESLint enforces React and Hooks rules. Keep both `src/text.js` copies identical.

## Testing Guidelines

Use `back-end/test/*.test.js` for API/helper tests and `front-end/e2e/*.spec.js` for browser flows. Tests use in-memory data and fake authentication, requiring no secrets or live services. Exercise API changes through `createApp({ db, verifyIdToken })`; update browser tests for affected user flows. Run all checks above before pushing. No numeric coverage threshold is configured.

## Commit & Pull Request Guidelines

Branch from `main` and keep PRs focused. History favors imperative subjects such as “Fix…” or “Move…”. Follow the PR template: explain changes, link issues, record testing, and include before/after screenshots for UI changes. CI must pass. Update README setup/API documentation and commit changed package lockfiles.

## Security & Configuration

Never commit or print `back-end/.env`, `credentials.json`, or `prod-env.yaml`. Follow README instructions for 1Password-backed setup. Preserve consent-gated analytics and keep commenter emails and user IDs out of public API responses.
