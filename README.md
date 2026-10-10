# Blogify | Read. Write. React.

[![CI](https://github.com/RoniRachmani/Example-Web-App/actions/workflows/ci.yml/badge.svg)](https://github.com/RoniRachmani/Example-Web-App/actions/workflows/ci.yml)

A full-stack blog built with React and Vite on the front end, Node.js and Express on the back end, MongoDB Atlas for storage and Firebase Authentication for sign-in. It is deployed as a single service on Google Cloud App Engine.

**Live site:** https://app.ronirachmani.com

![Screenshot of the Blogify app](https://github.com/user-attachments/assets/57297544-746d-4b7a-bab2-a9c32df6896f)

## Features

- Dark or light theme (follows the OS setting) with a top navigation bar
- Public pages: Home, About, Articles list and individual articles
- Accounts: sign in, create an account and sign out with Firebase Authentication (email and password)
- A display name, set when creating an account and changeable on the Profile page
- Signed-in users can upvote an article (once per user) and add comments. A comment shows its author's display name, or "Anonymous" if they haven't set one; email addresses are never shown.
- Google Analytics loads only after a visitor accepts it in the cookie banner, and the footer's "Cookie settings" lets them change their mind

## Tech stack

| Layer      | Tools |
| ---------- | ----- |
| Front end  | React 19, React Router 7 (data loaders), Vite, Axios, Firebase Web SDK, plain CSS |
| Back end   | Node.js 22, Express 5, MongoDB Node driver, Firebase Admin SDK |
| Data       | MongoDB Atlas |
| Hosting    | Google Cloud App Engine (standard, `nodejs24` runtime) |
| Tooling    | ESLint 10, `node:test`, GitHub Actions, Dependabot, Claude Code |

## Project structure

```
.
├── front-end/                 # React single-page app (Vite)
│   ├── src/
│   │   ├── pages/             # Route components (Home, About, Articles, Article, Login, ...)
│   │   ├── article-content.js # Article titles and bodies (static)
│   │   ├── useUser.js         # Hook exposing the current Firebase user
│   │   ├── displayName.js     # Display name validation and save helper
│   │   ├── text.js            # Text limits and name clean-up (copy of back-end/src/text.js)
│   │   ├── firebase.js        # Firebase client config
│   │   ├── analytics.js       # Analytics consent: Analytics loads only once accepted
│   │   └── main.jsx           # Entry point
│   ├── e2e/                   # Browser tests (Playwright; Firebase faked, /api is the real back end)
│   └── vite.config.js         # Dev server proxies /api to localhost:8000
├── back-end/                  # Express API that also serves the built front end
│   ├── src/
│   │   ├── app.js             # Routes, built by createApp({ db, verifyIdToken })
│   │   ├── text.js            # Text limits and name clean-up, shared with the front end
│   │   └── server.js          # Startup: reads secrets, connects to MongoDB, listens
│   ├── test/                  # API tests (node:test, in-memory fakes)
│   └── app.yaml               # App Engine config
├── .claude/                   # Claude Code slash commands and SessionStart hook
└── .github/                   # CI, Dependabot and Claude workflows
```

Article text lives in the front end (`front-end/src/article-content.js`). MongoDB only stores the per-article upvotes and comments, matched by the article's `name`.

## Getting started

### Prerequisites

- Node.js 22 (see `.nvmrc`; run `nvm use` if you use nvm)
- A MongoDB Atlas cluster
- A Firebase project with Email/Password sign-in enabled
- The [Google Cloud CLI](https://cloud.google.com/sdk/docs/install), only if you deploy

### 1. Install dependencies

```bash
cd back-end && npm install
cd ../front-end && npm install
```

### 2. Add the back-end secrets

These files are gitignored. Never commit them.

| File | Used for | Contents |
| ---- | -------- | -------- |
| `back-end/credentials.json` | Firebase Admin, to verify sign-in tokens | A Firebase service account key (Firebase console → Project settings → Service accounts → Generate new private key) |
| `back-end/.env` | Local development | `MONGODB_USERNAME=...` and `MONGODB_PASSWORD=...` |
| `back-end/prod-env.yaml` | App Engine deploys (included by `app.yaml`) | The same two variables, under `env_variables:` |

Example `prod-env.yaml`:

```yaml
env_variables:
  MONGODB_USERNAME: "your-user"
  MONGODB_PASSWORD: "your-password"
```

To use a different MongoDB, such as a local `mongod`, set `MONGODB_URI` (e.g. `MONGODB_URI=mongodb://localhost:27017`) instead of the username and password.

The Atlas cluster host and database name (`full-stack-react-db`) are set in `back-end/src/server.js`, and the Firebase client config is in `front-end/src/firebase.js`. Change both if you point the app at your own projects.

### 3. Seed the database

Create an `articles` collection in the `full-stack-react-db` database with one document per article in `article-content.js`:

```js
db.articles.insertMany([
  { name: 'learn-react', upvotes: 0, upvoteIds: [], comments: [] },
  { name: 'learn-node',  upvotes: 0, upvoteIds: [], comments: [] },
  { name: 'mongodb',     upvotes: 0, upvoteIds: [], comments: [] },
]);
```

### 4. Run it

In two terminals:

```bash
cd back-end && npm run dev    # API on http://localhost:8000 (restarts on change via node --watch)
cd front-end && npm run dev   # App on http://localhost:5173, proxies /api to the back end
```

## Scripts

| Directory   | Command           | What it does |
| ----------- | ----------------- | ------------ |
| `front-end` | `npm run dev`     | Start the Vite dev server |
| `front-end` | `npm run build`   | Build to `front-end/dist` |
| `front-end` | `npm run lint`    | Run ESLint |
| `front-end` | `npm run preview` | Serve the production build locally |
| `front-end` | `npm run test:e2e` | Build the app and run the browser tests in Chromium. Firebase is faked and the API is the real back end with an in-memory database, so no MongoDB or secrets are needed, but `back-end` must have its dependencies installed. Run `npx playwright install chromium` once first |
| `back-end`  | `npm test`        | Run the API tests. They use in-memory fakes, so no database or secrets are needed |
| `back-end`  | `npm run dev`     | Start the API with `node --watch` |
| `back-end`  | `npm start`       | Start the API (what App Engine runs) |

## API

All routes are under `/api`. Write routes need a Firebase ID token in an `authtoken` request header. A missing or invalid token returns `401`, and an unknown article returns `404`.

Requests are rate limited and return `429` over the limit: 1000 requests per client IP every 15 minutes across the whole site, and 30 upvotes and comments per user every 15 minutes. Responses carry the standard `RateLimit` and `RateLimit-Policy` headers.

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET`  | `/api/articles/:name` | No | Get an article as `{ name, upvotes, upvoted, comments }`, each comment as `{ postedBy, text }`. Send a token (optional) to have `upvoted` say whether that user has upvoted; without one, or with an invalid one, it's `false`. Who upvoted and commenters' `uid`s are never sent. The two `POST` routes return the same shape |
| `POST` | `/api/articles/:name/upvote` | Yes | Upvote an article, once per user. Returns `403` if already upvoted |
| `POST` | `/api/articles/:name/comments` | Yes | Add a comment. Body: `{ "text": "..." }`, 1–1000 characters after trimming, otherwise `400`. The author comes from the sign-in token, never the body: the user's display name, or `Anonymous` if they have no name or it has nothing visible in it (never their email). Names have control and bidi-override characters removed and are cut to 50 characters without splitting an emoji. Limits count Unicode code points, so an emoji is one character. Each comment also stores the author's `uid`, since display names aren't unique |

Any other non-`/api` path returns the front end's `index.html`, so client-side routes work on refresh.

## Deployment

The back end serves the built front end from `back-end/dist`, so the whole app deploys as one App Engine service:

```bash
cd front-end && npm run build
rm -rf ../back-end/dist && cp -r dist ../back-end/dist
cd ../back-end && gcloud app deploy --project=<your-project-id>
```

`credentials.json` and `prod-env.yaml` must be present in `back-end/` when you deploy. In Claude Code, the `/deploy` command runs these steps, checks for the secret files first and removes old App Engine versions afterwards.

## Continuous integration

- **CI** (`.github/workflows/ci.yml`) runs on every pull request and on pushes to `main`. It lints and builds the front end, runs the browser tests and the back-end tests, and checks that the back end's dependencies load.
- **Dependabot** opens weekly update PRs for npm packages and GitHub Actions. npm minor and patch updates are grouped and merge automatically once CI passes. Major updates and GitHub Actions updates wait for review. Workflows pin actions to commit SHAs.
- **Claude Code** reviews pull requests automatically, and responds when someone mentions `@claude` in an issue or PR.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). To report a security issue, see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)

## Acknowledgements

Based on the LinkedIn Learning course [React: Creating and Hosting a Full-Stack Site](https://www.linkedin.com/learning/react-creating-and-hosting-a-full-stack-site-24928483).
