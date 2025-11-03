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
      '/api/hotelbeds': {
        target: 'https://api.test.hotelbeds.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hotelbeds/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 Proxy request:', req.method, req.url)
          })
        }
      }
    }
  }
})