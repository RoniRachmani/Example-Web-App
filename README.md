# Blogify | Read. Write. React.

[![CI](https://github.com/RoniRachmani/Example-Web-App/actions/workflows/ci.yml/badge.svg)](https://github.com/RoniRachmani/Example-Web-App/actions/workflows/ci.yml)

A full-stack blog built with React and Vite on the front end, Node.js and Express on the back end, MongoDB Atlas for storage and Firebase Authentication for sign-in. It is deployed as a single service on Google Cloud App Engine.

**Live site:** https://app.ronirachmani.com

![Screenshot of the Blogify app](https://github.com/user-attachments/assets/57297544-746d-4b7a-bab2-a9c32df6896f)

## Features

- Dark or light theme (follows the OS setting) with a top navigation bar
- Public pages: Home, About, Articles list and individual articles
- Accounts: sign in, create an account and sign out with Firebase Authentication (email and password)
- Signed-in users can upvote an article (once per user) and add comments

## Tech stack

| Layer      | Tools |
| ---------- | ----- |
| Front end  | React 19, React Router 7 (data loaders), Vite, Axios, Firebase Web SDK, plain CSS |
| Back end   | Node.js 22, Express 5, MongoDB Node driver, Firebase Admin SDK |
| Data       | MongoDB Atlas |
| Hosting    | Google Cloud App Engine (standard, `nodejs22` runtime) |
| Tooling    | ESLint 9, GitHub Actions, Dependabot, Claude Code |

## Project structure

```
.
├── front-end/                 # React single-page app (Vite)
│   ├── src/
│   │   ├── pages/             # Route components (Home, About, Articles, Article, Login, ...)
│   │   ├── article-content.js # Article titles and bodies (static)
│   │   ├── useUser.js         # Hook exposing the current Firebase user
│   │   └── main.jsx           # Entry point and Firebase client config
│   └── vite.config.js         # Dev server proxies /api to localhost:8000
├── back-end/                  # Express API that also serves the built front end
│   ├── src/server.js
│   └── app.yaml               # App Engine config
├── .claude/commands/          # Claude Code slash commands (/run-local, /deploy, ...)
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

The Atlas cluster host and database name (`full-stack-react-db`) are set in `back-end/src/server.js`, and the Firebase client config is in `front-end/src/main.jsx`. Change both if you point the app at your own projects.

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
cd back-end && npm run dev    # API on http://localhost:8000 (restarts on change via nodemon)
cd front-end && npm run dev   # App on http://localhost:5173, proxies /api to the back end
```

## Scripts

| Directory   | Command           | What it does |
| ----------- | ----------------- | ------------ |
| `front-end` | `npm run dev`     | Start the Vite dev server |
| `front-end` | `npm run build`   | Build to `front-end/dist` |
| `front-end` | `npm run lint`    | Run ESLint |
| `front-end` | `npm run preview` | Serve the production build locally |
| `back-end`  | `npm run dev`     | Start the API with nodemon |
| `back-end`  | `npm start`       | Start the API (what App Engine runs) |

## API

All routes are under `/api`. Write routes need a Firebase ID token in an `authtoken` request header.

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| `GET`  | `/api/articles/:name` | No | Get an article's upvotes and comments |
| `POST` | `/api/articles/:name/upvote` | Yes | Upvote an article (once per user; `403` if already upvoted) |
| `POST` | `/api/articles/:name/comments` | Yes | Add a comment. Body: `{ "postedBy": "...", "text": "..." }` |

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

- **CI** (`.github/workflows/ci.yml`) runs on every pull request and on pushes to `main`. It lints and builds the front end and checks that the back end's dependencies load.
- **Dependabot** opens weekly update PRs for npm packages and GitHub Actions. Minor and patch updates are grouped and merge automatically once CI passes. Major updates wait for review.
- **Claude Code** reviews pull requests automatically, and responds when someone mentions `@claude` in an issue or PR.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). To report a security issue, see [SECURITY.md](SECURITY.md).

## Acknowledgements

Based on the LinkedIn Learning course [React: Creating and Hosting a Full-Stack Site](https://www.linkedin.com/learning/react-creating-and-hosting-a-full-stack-site-24928483).
