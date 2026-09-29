This repository is Blogify, a small full-stack blog. The front end is React 19 and Vite (`front-end/`). The back end is an Express 5 API (`back-end/src/server.js`) backed by MongoDB Atlas, with Firebase Authentication. It deploys to Google Cloud App Engine. See `CLAUDE.md` for the full project guide.

## Development flow

- Install: `npm install` in both `front-end/` and `back-end/` (they are separate packages)
- Run: `npm run dev` in `back-end/` (port 8000) and in `front-end/` (port 5173, proxies `/api`)
- Lint: `npm run lint` in `front-end/`
- Build: `npm run build` in `front-end/`
- There is no test suite yet. CI runs lint, build and a back-end import check.

## Repository structure

- `front-end/src/pages/`: route components. Routes are in `front-end/src/App.jsx`.
- `front-end/src/article-content.js`: static article text
- `back-end/src/server.js`: the whole API and static file server
- `back-end/app.yaml`: App Engine config
- `.github/workflows/`: CI, Dependabot auto-merge and Claude workflows

## Key guidelines

1. Use ES modules, 2-space indentation, function components and `async/await`.
2. Target Node 22 to match App Engine and CI.
3. Never commit `back-end/credentials.json`, `back-end/.env` or `back-end/prod-env.yaml`.
4. Keep ESLint on v9. `eslint-plugin-react` does not support v10.
5. Keep the `overrides` in each `package.json`. They pin patched transitive dependencies.
6. Update `README.md` when you change setup steps, environment variables or API routes.
