-- Tabela para gerenciar o Funil de Vendas Comercial (Leads Internos para prospectar Agências)
CREATE TABLE IF NOT EXISTS public.funil_vendas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_empresa text NOT NULL, -- Nome da agência/lead
    contato_nome text,
    contato_email text,
    contato_telefone text,
    origem text, -- Indicação, Instagram, Google, etc.
    status text NOT NULL DEFAULT 'LEAD', -- LEAD, APRESENTACAO, REUNIAO, ENVIAR_CONTRATO, CONTRATO_ENVIADO, ASSINADO, PERDIDO
    valor_mensalidade numeric,
    data_criacao timestamptz DEFAULT now(),
    data_atualizacao timestamptz DEFAULT now(),
    proxima_acao_data timestamptz,
    proxima_acao_descricao text,
    motivo_perda text,
    responsavel_id uuid REFERENCES auth.users(id) -- Quem está cuidando desse lead
);

-- RLS
ALTER TABLE public.funil_vendas ENABLE ROW LEVEL SECURITY;

-- Admins e Comercial podem ver e editar tudo
CREATE POLICY "Acesso total para admin e comercial" ON public.funil_vendas
    FOR ALL
    USING (
        auth.jwt() ->> 'role' = 'service_role' 
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'comercial')
        )
    );
