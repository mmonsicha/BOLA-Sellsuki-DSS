import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@sellsuki-org/sellsuki-components/style.css'
import App from './App.tsx'

document.documentElement.setAttribute("data-product", "sellsuki");
document.documentElement.setAttribute("data-app-shell", "sellsuki");

// Log active env config on startup so it's easy to verify after restart
// eslint-disable-next-line no-console
console.log("[BOLA] env:", {
  VITE_API_URL: import.meta.env.VITE_API_URL || "(empty — using Vite proxy)",
  VITE_PUBLIC_API_URL: import.meta.env.VITE_PUBLIC_API_URL || "(empty — fallback to VITE_API_URL)",
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
  VITE_AUTH_MODE: import.meta.env.VITE_AUTH_MODE,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
