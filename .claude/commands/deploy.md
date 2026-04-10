Build and deploy the app to Google Cloud App Engine.

Steps:
1. Build the front-end: run `npm run build` in the `front-end/` directory
2. Copy the build output: copy `front-end/dist/` to `back-end/dist/`
3. Deploy to App Engine: run `gcloud app deploy --project=full-stack-react-493e2 --quiet` from the `back-end/` directory

Use `/opt/homebrew/bin/gcloud` for the gcloud binary. Use a 10-minute timeout for the deploy command.
