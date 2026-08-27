import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import { getLocale } from './lib/presets'
import './styles.css'

// ?reset=1 clears local demo data. Do not use ?fresh=1 for cache — it used to wipe sessions.
const params = new URLSearchParams(window.location.search)
if (params.has('reset')) {
  try {
    localStorage.removeItem('sonique.profiles')
    localStorage.removeItem('sonique.currentEmail')
    localStorage.removeItem('sonique.rememberEmail')
    localStorage.removeItem('sonique.sessions')
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.includes('auth-token')) {
        localStorage.removeItem(key)
      }
    }
    sessionStorage.setItem('sonique.forceFresh', '1')
  } catch {
    /* ignore */
  }
  params.delete('reset')
  const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
  window.history.replaceState({}, '', next)
}

const locale = getLocale()
document.documentElement.lang = locale
document.title =
  locale === 'en'
    ? 'Sonique — Play your favorite pieces'
    : 'Sonique — Joue tes morceaux préférés'

// Auth email links sometimes land with #error=... (expired confirm link, etc.)
try {
  const rawHash = window.location.hash.replace(/^#/, '')
  if (rawHash.includes('error')) {
    const hp = new URLSearchParams(rawHash)
    const code = (hp.get('error_code') || '').toLowerCase()
    const desc = (hp.get('error_description') || '').toLowerCase()
    if (
      code === 'otp_expired' ||
      desc.includes('expired') ||
      desc.includes('invalid') ||
      hp.get('error') === 'access_denied'
    ) {
      sessionStorage.setItem('sonique.authFlash', 'link_expired')
    }
    const clean = `${window.location.pathname}${window.location.search}`
    window.history.replaceState({}, '', clean)
  }
} catch {
  /* ignore */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
