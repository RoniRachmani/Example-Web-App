Commit all changes and push to GitHub, then optionally deploy.

Steps:
1. Run `git status` and `git diff --stat` to see what changed
2. Stage the relevant files (avoid committing secrets like .env or credentials.json)
3. Create a commit with a concise message describing the changes
4. Push to `origin main`
5. Ask the user if they also want to deploy to Google Cloud (run /deploy if yes)
