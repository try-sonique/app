import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { getLocale } from './lib/presets'
import './styles.css'

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
