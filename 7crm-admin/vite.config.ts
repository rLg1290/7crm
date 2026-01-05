import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.APP_BASE || '/',
  plugins: [react()],
  server: {
    port: 3001,
    host: true,
    proxy: {
      '/api': {
        target: process.env.ADMIN_API_ORIGIN || 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
