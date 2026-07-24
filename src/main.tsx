import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { getLocale } from './lib/presets'
import './styles.css'

// Demo helper: ?fresh=1 clears saved profile so the flow starts blank
const params = new URLSearchParams(window.location.search)
if (params.has('fresh') || params.has('reset')) {
  try {
    localStorage.removeItem('sonique.profiles')
    localStorage.removeItem('sonique.currentEmail')
    localStorage.removeItem('sonique.sessions')
  } catch {
    /* ignore */
  }
  params.delete('fresh')
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
