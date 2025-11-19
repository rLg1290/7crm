import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  server: {
    proxy: {
      // Integração com Hotelbeds desativada
    }
  }
})