Build and deploy the app to Google Cloud App Engine.

Prerequisites (both are gitignored, so they must be copied onto each machine by hand):
- `back-end/prod-env.yaml` — included by `app.yaml`; holds `MONGODB_USERNAME` / `MONGODB_PASSWORD`
- `back-end/credentials.json` — Firebase service account key read by `server.js` at startup
If either is missing, stop and tell the user; deploying without them breaks the live app.

Steps:
1. Build the front-end: run `npm run build` in the `front-end/` directory
2. Copy the build output: copy `front-end/dist/` to `back-end/dist/`
3. Deploy to App Engine: run `gcloud app deploy --project=full-stack-react-493e2 --quiet` from the `back-end/` directory
4. Only if the deploy succeeded, delete old versions, keeping the live one and the newest one without traffic (the previous deploy, for rollback):
   ```
   gcloud app versions list --project=full-stack-react-493e2 --service=default --sort-by=~version.createTime --filter="traffic_split=0" --format="value(id)" | tail -n +2 | xargs -r gcloud app versions delete --service=default --project=full-stack-react-493e2 --quiet
   ```
   Use the same gcloud binary in both places. Afterwards, list the versions to confirm exactly two remain.

For the gcloud binary, use `gcloud` if it is on PATH, otherwise the first of `/opt/homebrew/bin/gcloud` or `~/google-cloud-sdk/bin/gcloud` that exists. Use a 10-minute timeout for the deploy command.
