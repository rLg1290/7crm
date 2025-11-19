import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Evitar exposição de URL/Key em produção
if (import.meta.env.MODE === 'development') {
  logger.debug('🔧 Supabase env carregado (dev)')
  logger.debug('📍 URL definida?', Boolean(supabaseUrl))
  logger.debug('🔑 Key definida?', Boolean(supabaseAnonKey))
}

if (!supabaseUrl || !supabaseAnonKey) {
  // Não usar fallback com chaves públicas; apenas alertar em dev
  if (import.meta.env.MODE === 'development') {
    logger.warn('⚠️ Variáveis VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY não definidas no ambiente de desenvolvimento')
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)