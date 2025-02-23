import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBOvRp1nW0P7L6-A5gdGZtOoZxVQyfX_aU",
  authDomain: "full-stack-react-493e2.firebaseapp.com",
  projectId: "full-stack-react-493e2",
  storageBucket: "full-stack-react-493e2.firebasestorage.app",
  messagingSenderId: "899179658141",
  appId: "1:899179658141:web:f2c9005f4ce13eaa1e8d74",
  measurementId: "G-4WEWF7PCTH"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
