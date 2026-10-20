import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { recoverDeployment } from './services/deploymentRecovery.js'

window.addEventListener('vite:preloadError', recoverDeployment)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
