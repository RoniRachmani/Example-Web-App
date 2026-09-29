Start both the back-end and front-end dev servers locally.

Prerequisites: `back-end/credentials.json` and `back-end/.env` (with `MONGODB_USERNAME` and `MONGODB_PASSWORD`) must exist, or the back end exits at startup. If either is missing, tell the user instead of starting the servers. If `node_modules` is missing in either directory, run `npm install` there first.

Steps:
1. Start the back-end: run `npm run dev` in the `back-end/` directory (run in background)
2. Start the front-end: run `npm run dev` in the `front-end/` directory (run in background)
3. Wait a few seconds, then check the output of both to confirm they started successfully. The back end should log "Server is listening on port 8000".
4. Report the URLs to the user: the app is at http://localhost:5173 (Vite proxies `/api` to the back end on http://localhost:8000)
