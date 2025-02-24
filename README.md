# Example Web App 🚀

A full-stack JavaScript/Node.js web app using the MERN stack (MongoDB, Express, React, Node.js) with Firebase authentication.

## 🛠️ Tech Stack

<details>
<summary><strong>Frontend</strong></summary>

- ⚛️ React with Vite as the build tool
- 🔐 Firebase for authentication
- 📡 Axios for API calls
- 🎨 CSS for styling
</details>

<details>
<summary><strong>Backend</strong></summary>

- 📦 Node.js with Express.js framework
- 🗄️ MongoDB Atlas for database
- 🔄 RESTful API
</details>

<details>
<summary><strong>Development & Deployment</strong></summary>

- 💻 VS Code as the IDE
- 📚 GitHub for version control
- ☁️ Google Cloud Platform (GCP) for hosting
</details>

## ✨ Features

- 🌓 Dark or light-themed user interface with a top navigation bar
- 📱 Public pages: Home, About, Articles listing, individual Article detail
- 🔐 User authentication: Sign In, Create Account, Sign Out
- 💬 Protected functionality: Adding comments & upvoting (available to logged-in users)

## 📋 Prerequisites

- Node.js (v16 or higher)
- Vite (v4.x)
- MongoDB
- Firebase account
- Google Cloud account

## 🚀 Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/example-web-app.git
cd example-web-app
```

### 2. Install dependencies

```bash
# Install backend dependencies
cd back-end
npm install

# Install frontend dependencies
cd ../front-end
npm create vite@latest . -- --template react-ts
npm install
```

### 3. Environment Setup

Create `.env` files in both frontend and backend directories:

```env
# Frontend (.env)
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_CONFIG=your_config_here

# Backend (.env)
PORT=3000
MONGODB_URI=your_mongodb_uri
```

### 4. Start the Application

```bash
# Terminal 1: Backend
cd back-end
npm start

# Terminal 2: Frontend
cd front-end
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to view the application.

## 🚀 Deployment

Detailed deployment instructions can be found in our [Deployment Guide](./docs/deployment.md).

## 📄 License

MIT
