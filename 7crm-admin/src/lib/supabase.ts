import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Evitar logs sensíveis em produção
if (import.meta.env.MODE === 'development') {
  console.debug('🔧 Supabase Admin env (dev) carregado')
  console.debug('📍 URL definida?', Boolean(supabaseUrl))
  console.debug('🔑 Key definida?', Boolean(supabaseAnonKey))
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  if (import.meta.env.MODE === 'development') {
    console.warn('⚠️ Variáveis VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY não definidas no Admin (dev)')
  }
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)
