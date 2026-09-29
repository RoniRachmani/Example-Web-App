# Blogify | Read. Write. React.

A full-stack React app using Node.js and Express backend, MongoDB database, Firebase authentication, deployed in Google Cloud

## Tech Stack

**Frontend**
- React with Vite as the build tool
- Firebase for authentication
- Axios for API calls
- CSS for styling

**Backend**
- Node.js with Express.js framework
- MongoDB Atlas for database
- RESTful API

**Development & Deployment**
- VS Code as the IDE
- GitHub for version control
- Google Cloud Platform (GCP) App Engine for hosting 

## Features

- Dark or light-themed user interface with a top navigation bar
- Public pages: Home, About, Articles listing, individual Article detail
- User authentication: Sign In, Create Account, Sign Out
- Protected functionality: Adding comments & upvoting (available to logged-in users)

## Running Locally

You need Node.js 22, the version App Engine runs.

1. Install dependencies in both apps:
   ```
   cd back-end && npm install
   cd ../front-end && npm install
   ```
2. Add the back-end secrets. Both files are gitignored:
   - `back-end/credentials.json`: a Firebase service account key for the `full-stack-react-493e2` project (Firebase console → Project settings → Service accounts → Generate new private key).
   - `back-end/.env` with the MongoDB Atlas login:
     ```
     MONGODB_USERNAME=...
     MONGODB_PASSWORD=...
     ```
     To use a different database, such as a local `mongod`, set `MONGODB_URI=mongodb://localhost:27017` instead. The database is `full-stack-react-db`, with an `articles` collection holding one document per article, e.g. `{ name: 'learn-react', upvotes: 0, comments: [] }`.
3. Start both dev servers, each in its own terminal:
   ```
   cd back-end && npm run dev    # API on http://localhost:8000
   cd front-end && npm run dev   # app on http://localhost:5173, proxies /api to the back end
   ```

## Tests and Checks

- Back end: `npm test` in `back-end/` runs the API tests. They use an in-memory fake database, so they don't need MongoDB or the secrets above.
- Front end: `npm run lint` and `npm run build` in `front-end/`.

CI runs all of these on every pull request.

## Deploying

The app runs on Google Cloud App Engine. The Claude Code `/deploy` command builds the front end, copies it into `back-end/dist/` and runs `gcloud app deploy`; see `.claude/commands/deploy.md`. Deploying also needs `back-end/prod-env.yaml`, which is gitignored and holds the production `MONGODB_USERNAME` and `MONGODB_PASSWORD`.

## API

Protected routes need a Firebase ID token in the `authtoken` header. A missing, invalid or expired token returns `401`.

| Method | Route | Auth | Request body | Responses |
| --- | --- | --- | --- | --- |
| GET | `/api/articles/:name` | No | – | `200` article, `404` unknown article |
| POST | `/api/articles/:name/upvote` | Yes | – | `200` updated article, `401` bad/missing token, `403` already upvoted, `404` unknown article |
| POST | `/api/articles/:name/comments` | Yes | `{ "text": string }` (1–1000 chars, trimmed) | `200` updated article, `400` invalid `text`, `401` bad/missing token, `404` unknown article |

A comment's `postedBy` is taken from the verified token (the user's display name, trimmed and cut to 50 characters, or their email if no name is set). The server ignores any `postedBy` sent in the request body.

## Screenshot

![Screenshot 2025-03-15 at 15 12 19](https://github.com/user-attachments/assets/57297544-746d-4b7a-bab2-a9c32df6896f)

## Thanks
LinkedIn Learning course [React: Creating and Hosting a Full-Stack Site](https://www.linkedin.com/learning-login/share?forceAccount=false&redirect=https%3A%2F%2Fwww.linkedin.com%2Flearning%2Freact-creating-and-hosting-a-full-stack-site-24928483%3Ftrk%3Dshare_ent_url%26shareId%3DMQUcG3bpQ%252BeSO3CBqaxnLw%253D%253D).
