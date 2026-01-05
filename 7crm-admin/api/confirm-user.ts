import type { VercelRequest, VercelResponse } from "@vercel/node"
import { createClient } from "@supabase/supabase-js"

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' })
    return
  }
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      res.status(500).json({ error: 'Variáveis SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes' })
      return
    }

    const { user_id } = req.body || {}
    if (!user_id) {
      res.status(400).json({ error: 'user_id é obrigatório' })
      return
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { error } = await (admin as any).auth.admin.updateUser(user_id, { email_confirm: true })
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro interno' })
  }
}

