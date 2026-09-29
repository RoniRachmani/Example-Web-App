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

## API

Protected routes need a Firebase ID token in the `authtoken` header. A missing, invalid or expired token returns `401`.

| Method | Route | Auth | Request body | Responses |
| --- | --- | --- | --- | --- |
| GET | `/api/articles/:name` | No | – | `200` article, `404` unknown article |
| POST | `/api/articles/:name/upvote` | Yes | – | `200` updated article, `401` bad/missing token, `403` already upvoted, `404` unknown article |
| POST | `/api/articles/:name/comments` | Yes | `{ "text": string }` (1–1000 chars, trimmed) | `200` updated article, `400` invalid `text`, `401` bad/missing token, `404` unknown article |

A comment's `postedBy` is taken from the verified token (the user's display name, or their email if no name is set). The server ignores any `postedBy` sent in the request body.

## Screenshot

![Screenshot 2025-03-15 at 15 12 19](https://github.com/user-attachments/assets/57297544-746d-4b7a-bab2-a9c32df6896f)

## Thanks
LinkedIn Learning course [React: Creating and Hosting a Full-Stack Site](https://www.linkedin.com/learning-login/share?forceAccount=false&redirect=https%3A%2F%2Fwww.linkedin.com%2Flearning%2Freact-creating-and-hosting-a-full-stack-site-24928483%3Ftrk%3Dshare_ent_url%26shareId%3DMQUcG3bpQ%252BeSO3CBqaxnLw%253D%253D).
