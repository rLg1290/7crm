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

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { email, password, nome, role, empresa_id, autoConfirm } = req.body || {}
    if (!email || !password) {
      res.status(400).json({ error: 'Email e senha são obrigatórios' })
      return
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: Boolean(autoConfirm),
      user_metadata: {
        nome,
        role,
        empresa_id: empresa_id || null,
      },
    } as any)

    if (error) {
      res.status(500).json({ error: error.message })
      return
    }

    const userId = (data?.user as any)?.id
    if (userId) {
      await admin.from('profiles').upsert({
        id: userId,
        email,
        nome: nome || null,
        role: role || 'user',
        empresa_id: empresa_id || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
    }

    res.status(200).json({ ok: true, user_id: userId })
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Erro interno' })
  }
}
