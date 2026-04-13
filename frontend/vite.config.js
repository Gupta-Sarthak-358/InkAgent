import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/run-agent': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
      '/models': 'http://localhost:3001',
      '/transactions': 'http://localhost:3001',
    },
  },
})
