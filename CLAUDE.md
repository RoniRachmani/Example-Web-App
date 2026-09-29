# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Overview

Blogify is a small full-stack blog. There are two independent npm packages with no shared workspace:

- `front-end/`: React 19 SPA built with Vite. Routes are defined in `src/App.jsx` with React Router 7 data loaders (`ArticlePage` exports a `loader`). Article text is static in `src/article-content.js`. Firebase Auth (email/password) runs client-side, and the Firebase client config is in `src/main.jsx`.
- `back-end/`: One Express 5 file, `src/server.js`. It serves `../dist` (the copied front-end build) and a small `/api` backed by MongoDB Atlas. Write routes verify a Firebase ID token passed in the `authtoken` header using firebase-admin.

MongoDB only stores `{ name, upvotes, upvoteIds, comments }` per article, keyed by the article `name` from `article-content.js`.

## Commands

Run each command in its package directory.

```bash
# front-end/
npm run dev      # Vite on :5173, proxies /api to :8000
npm run lint     # ESLint (flat config in eslint.config.js)
npm run build    # outputs front-end/dist

# back-end/
npm run dev      # nodemon on :8000
npm start
```

There are no automated tests. CI (`.github/workflows/ci.yml`) runs front-end `lint` and `build`, and checks that `back-end/src/server.js` gets as far as reading `credentials.json`, which proves its imports resolve. Before you push, run `npm run lint` and `npm run build` in `front-end/`.

## Secrets and local setup

The back end won't start without these gitignored files. Never create, print or commit their contents:

- `back-end/credentials.json`: Firebase service account key, read at startup
- `back-end/.env`: `MONGODB_USERNAME` and `MONGODB_PASSWORD` for local dev
- `back-end/prod-env.yaml`: the same variables for App Engine, included by `app.yaml`

The Firebase *web* config in `front-end/src/main.jsx` is public by design and is not a secret.

## Conventions

- ES modules everywhere (`"type": "module"`), with 2-space indentation.
- Match the existing style: function components, and `async/await` with Axios.
- Node 22 is the target in CI and on App Engine (`runtime: nodejs22`). Keep `.nvmrc`, `app.yaml` and CI in sync.
- ESLint is pinned to v9 because `eslint-plugin-react` doesn't support v10 yet (see `.github/dependabot.yml`). Don't upgrade it to v10.
- The `overrides` blocks in both `package.json` files pin transitive dependencies to fix security advisories. Don't remove entries without checking `npm audit`.

## Slash commands

`.claude/commands/` defines `/run-local`, `/deploy` (App Engine), `/push` and `/update-packages`.
