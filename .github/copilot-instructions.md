This is Blogify, a full-stack blog app: a React front end (Vite) and a Node.js/Express back end that stores articles in MongoDB Atlas and uses Firebase Authentication. It is deployed to Google Cloud App Engine. See `CLAUDE.md` for the full project guide. Please follow these guidelines when contributing:

## Code Standards

### Required Before Each Commit
- Back end: run `npm test` in `back-end/`
- Front end: run `npm run lint`, `npm run build` and `npm run test:e2e` in `front-end/` (run `npx playwright install chromium` once first)
- CI runs the same checks on every pull request (`.github/workflows/ci.yml`)

### Development Flow
- Install: `npm install` in both `back-end/` and `front-end/`
- Run locally: `npm run dev` in `back-end/` (API on port 8000) and in `front-end/` (Vite on port 5173, proxying `/api` to the back end)
- The back end needs two gitignored files, `back-end/credentials.json` (Firebase service account key) and `back-end/.env` (`MONGODB_USERNAME` and `MONGODB_PASSWORD`, or `MONGODB_URI`). Never commit them or `back-end/prod-env.yaml`.

## Repository Structure
- `back-end/src/app.js`: Express routes, built by `createApp({ db, verifyIdToken })`
- `back-end/src/server.js`: startup code that reads the secrets, connects to MongoDB and listens
- `back-end/test/`: API tests using `node:test`, with an in-memory fake database and token checker
- `back-end/app.yaml`: App Engine config
- `front-end/src/pages/`: one component per route; `ArticlePage.jsx` also exports the route's `loader`
- `front-end/src/App.jsx`: React Router routes
- `front-end/src/article-content.js`: article titles and text; MongoDB holds only upvotes and comments
- `front-end/e2e/`: Playwright browser tests; `fixtures.js` fakes Firebase Auth and the `/api` routes
- `.claude/commands/`: Claude Code commands, including `/deploy`

## Key Guidelines
1. Use ES modules and match the existing style: function components and hooks in the front end, async/await in the back end
2. Routes under `/api` that change data must stay behind the Firebase auth middleware in `app.js` and take the user from `req.user`, never from the request body
3. Return the right status codes: 401 for missing or invalid tokens, 404 for unknown articles, 400 for invalid input
4. Add or update tests in `back-end/test/` for API changes, using the fakes passed to `createApp` rather than a real database
5. Keep dependency changes minimal; Dependabot manages version bumps
6. Target Node 22 (`.nvmrc`), matching App Engine and CI
7. Keep ESLint on v9, since `eslint-plugin-react` does not support v10, and keep the `overrides` in each `package.json`, which pin patched transitive dependencies
8. Update `README.md` when you change setup steps, environment variables or API routes
