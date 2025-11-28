import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Evitar exposição de URL/Key em produção
if (import.meta.env.MODE === 'development') {
  logger.debug('🔧 Supabase env carregado (dev)')
  logger.debug('📍 URL definida?', Boolean(supabaseUrl))
  logger.debug('🔑 Key definida?', Boolean(supabaseAnonKey))
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  if (import.meta.env.MODE === 'development') {
    logger.warn('⚠️ Variáveis VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY não definidas; recursos de autenticação/desempenho indisponíveis em dev.')
  }
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
