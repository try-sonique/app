import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages: VITE_BASE=/app/ . Local + Vercel stay at "/".
const base =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.VITE_BASE || '/'

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    host: true,
    port: 43123,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 43123,
    strictPort: true,
  },
})
