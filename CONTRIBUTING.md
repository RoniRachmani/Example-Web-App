# Contributing

Thanks for helping improve Blogify! This is a small learning project, so contributions of any size are welcome. Please follow the [Code of Conduct](CODE_OF_CONDUCT.md), and note that contributions are licensed under the project's [MIT License](LICENSE).

## Setup

Follow [Getting started](README.md#getting-started) in the README. You'll need Node.js 22, plus your own MongoDB Atlas cluster and Firebase project to run the back end.

## Making a change

1. Branch off `main`.
2. Keep each pull request focused on one change.
3. Before pushing, run the same checks CI does:
   ```bash
   cd back-end && npm test
   cd ../front-end && npm run lint && npm run build && npm run test:e2e
   ```
   The back-end tests use in-memory fakes, so they run without MongoDB or the secret files. Add or update tests in `back-end/test/` when you change the API.

   The browser tests in `front-end/e2e/` fake Firebase and run the real back end with an in-memory database, so they don't need MongoDB or secrets either, but both packages must be installed. Run `npx playwright install chromium` once before the first run. Add or update them when you change sign-up, log-in, the profile page, the article page (upvotes and comments), the cookie banner or the nav bar.
4. Open a pull request and fill in the template. CI must pass before merging.

## Guidelines

- Match the surrounding code style: ES modules, 2-space indentation, function components and `async/await`.
- Never commit secrets. `back-end/credentials.json`, `back-end/.env` and `back-end/prod-env.yaml` are gitignored for a reason.
- Update the README when you change setup steps, environment variables or API routes.
- Dependabot handles routine dependency updates. If you change dependencies by hand, commit the updated `package-lock.json`.

## Reporting bugs and ideas

Open an [issue](https://github.com/RoniRachmani/Example-Web-App/issues/new/choose). For security problems, follow [SECURITY.md](SECURITY.md) instead.
