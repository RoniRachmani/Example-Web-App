// First, so the Firebase app exists before anything uses it: App.jsx creates the
// router when it loads, which starts the first page's loader straight away.
import './firebase.js'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { applyConsent } from './analytics.js'
import './index.css'

// Starts Analytics only if the visitor already agreed on an earlier visit
applyConsent();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
