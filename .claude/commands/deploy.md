Build and deploy the app to Google Cloud App Engine.

Prerequisites (both are gitignored, so they must be copied onto each machine by hand):
- `back-end/prod-env.yaml` — included by `app.yaml`; holds `MONGODB_USERNAME` / `MONGODB_PASSWORD`
- `back-end/credentials.json` — Firebase service account key read by `server.js` at startup
If either is missing, stop and tell the user; deploying without them breaks the live app.

Steps:
1. Build the front-end: run `npm run build` in the `front-end/` directory
2. Copy the build output: copy `front-end/dist/` to `back-end/dist/`
3. Deploy to App Engine: run `gcloud app deploy --project=full-stack-react-493e2 --quiet` from the `back-end/` directory

For the gcloud binary, use `gcloud` if it is on PATH, otherwise the first of `/opt/homebrew/bin/gcloud` or `~/google-cloud-sdk/bin/gcloud` that exists. Use a 10-minute timeout for the deploy command.
