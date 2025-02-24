# Example Web App

A full-stack JavaScript/Node.js web app using the MERN stack (MongoDB, Express, React, Node.js) with Firebase authentication.

## Tech Stack

### Frontend
- React with Vite as the build tool
- Firebase for authentication
- Axios for API calls
- CSS for styling

### Backend
- Node.js with Express.js framework
- MongoDB Atlas for database
- RESTful API

### Deployment
- VS Code as the IDE
- GitHub for version control
- Google Cloud Platform (GCP) for hosting 

## Features

- User authentication with Firebase
- Secure data storage with MongoDB
- RESTful API endpoints
- Cloud-hosted infrastructure
- Responsive design

## Prerequisites

- Node.js (v16 or higher)
- Vite (v4.x)
- MongoDB
- Firebase account
- Google Cloud account

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/example-web-app.git
cd example-web-app
```

2. Install dependencies:
```bash
# Install backend dependencies
cd back-end
npm install

# Install frontend dependencies with Vite
cd ../front-end
npm create vite@latest . -- --template react-ts
npm install
```

3. Set up environment variables:
Create `.env` files in both frontend and backend directories with the necessary configuration.

4. Run the application:
```bash
# Start backend server
cd back-end
npm start

# Start Vite development server
cd front-end
npm run dev
```

Visit `http://localhost:5173` to view the application.

## Deployment

The application is deployed on Google Cloud Platform. Follow the deployment documentation for detailed instructions.

## License

MIT
