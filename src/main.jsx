import {AppErrorBoundary} from './components/AppErrorBoundary.jsx'
import {UpdateNotice} from './components/UpdateNotice.jsx'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { recoverDeployment } from './services/deploymentRecovery.js'

window.addEventListener('vite:preloadError', recoverDeployment)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary><App /><UpdateNotice /></AppErrorBoundary>
  </StrictMode>,
)
