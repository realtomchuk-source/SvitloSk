import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'
import './styles/legacy/style.css'
import './styles/pages.css'
import { initDB } from '@/services/db'
import { migrateFromLocalStorage } from '@/services/migrationService'

initDB();
migrateFromLocalStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
