import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Logs para debug em produção
console.log('🔧 Debug Supabase Config (Admin):');
console.log('📍 URL:', supabaseUrl ? '✅ Definida' : '❌ Não definida');
console.log('🔑 Key:', supabaseAnonKey ? '✅ Definida' : '❌ Não definida');
console.log('🌍 Environment:', import.meta.env.MODE);

// Fallback para desenvolvimento se as variáveis não estiverem carregadas
const finalUrl = supabaseUrl || 'https://ethmgnxyrgpkzgmkocwk.supabase.co'
const finalKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aG1nbnh5cmdwa3pnbWtvY3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NjUwNTgsImV4cCI6MjA2NDE0MTA1OH0.TiDO0RTtrPU4RCka2iTvWZDz4S8kELlqTVDm6NkSNeI'

console.log('🔗 Supabase Admin conectado:', finalUrl.substring(0, 30) + '...');

export const supabase = createClient(finalUrl, finalKey)