import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  // Define base para acertos de assets em produção
  // Ajuste APP_BASE no ambiente de build se hospedar em subpasta (ex.: /g360/)
  base: process.env.APP_BASE || '/',
  plugins: [react()],
  envDir: './',
  define: {
    'process.env': {}
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api/7capi': {
        target: 'https://7capi.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/7capi/, '/api')
      }
    }
  }
})
