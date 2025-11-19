import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const empresa_id = (req.query.empresa_id || req.query.empresaId) as string | undefined;
    const redirect_path = (req.query.redirect_path || req.query.redirectPath) as string | undefined;

    if (!empresa_id) {
      res.status(400).json({ error: "Parâmetro empresa_id é obrigatório" });
      return;
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const BACKOFFICE_EMAIL = process.env.BACKOFFICE_EMAIL; // ex.: backoffice@7cturismo.com.br
    const CRM_BASE_URL = process.env.CRM_BASE_URL; // ex.: https://g360.7cturismo.com.br

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BACKOFFICE_EMAIL || !CRM_BASE_URL) {
      res.status(500).json({
        error:
          "Variáveis de ambiente faltando. Necessário SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BACKOFFICE_EMAIL, CRM_BASE_URL",
      });
      return;
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const base = CRM_BASE_URL.replace(/\/$/, "");
    const path = redirect_path ? (redirect_path.startsWith("/") ? redirect_path : `/${redirect_path}`) : "";

    // Após login, irá redirecionar ao CRM com empresa selecionada em modo backoffice
    const redirectTo = `${base}${path}?empresa_id=${encodeURIComponent(empresa_id)}&backoffice=1`;

    // Gera o magic link para o usuário Backoffice
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: BACKOFFICE_EMAIL,
      options: { redirectTo },
    } as any);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const actionLink = (data as any)?.action_link || (data as any)?.properties?.action_link;
    if (!actionLink) {
      res.status(500).json({ error: "Não foi possível gerar o magic link (action_link ausente)" });
      return;
    }

    // Redireciona imediatamente para o magic link
    res.status(302).setHeader("Location", actionLink).end();
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Erro interno" });
  }
}