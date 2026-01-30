import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CotacaoProvider } from './contexts/CotacaoContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CotacaoProvider>
      <App />
    </CotacaoProvider>
  </React.StrictMode>,
) 