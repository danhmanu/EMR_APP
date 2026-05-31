import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppWithProvider from './QueryProvider'
import 'antd/dist/reset.css'
import './styles.css'

// Optional dev bypass; keep disabled by default so login/permissions are exercised.
if ((import.meta as any).env?.DEV && (import.meta as any).env?.VITE_ENABLE_DEV_AUTH === 'true') {
  try {
    const k = 'auth_token'
    if (!localStorage.getItem(k)) localStorage.setItem(k, (import.meta as any).env.VITE_DEV_TOKEN || 'dev-admin-token-please-change')
    if (!localStorage.getItem('auth_role')) localStorage.setItem('auth_role', 'admin')
    if (!localStorage.getItem('auth_username')) localStorage.setItem('auth_username', 'EMR Admin')
  } catch(e){}
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <AppWithProvider />
    </BrowserRouter>
  </React.StrictMode>
)
