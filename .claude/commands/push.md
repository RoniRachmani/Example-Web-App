Commit all changes and push to GitHub, then optionally deploy.

Steps:
1. Run `git status` and `git diff --stat` to see what changed
2. Run the checks CI runs: `npm test` in `back-end/` if back-end files changed, and `npm run lint` and `npm run build` in `front-end/` if front-end files changed. Stop and report if any fail.
3. Stage the relevant files. Never commit secrets like `.env`, `credentials.json` or `prod-env.yaml`.
4. Create a commit with a concise message describing the changes
5. Push to `origin main`
6. Ask the user if they also want to deploy to Google Cloud (run /deploy if yes)
