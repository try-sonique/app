import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base: works on GitHub Pages and local preview
  base: '/app/',
})
