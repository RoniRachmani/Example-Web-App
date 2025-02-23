import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBNQuE3-cEx4s3hfu9s-F11pXCeJlJL12o",
  authDomain: "full-stack-react-934cb.firebaseapp.com",
  projectId: "full-stack-react-934cb",
  storageBucket: "full-stack-react-934cb.appspot.com",
  messagingSenderId: "710941682797",
  appId: "1:710941682797:web:98b92b892648986d4e2364"
};

const app = initializeApp(firebaseConfig);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
