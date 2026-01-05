-- Tabela para gerenciar permissões por cargo (role)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role text PRIMARY KEY,
    label text NOT NULL, -- Nome legível (ex: 'Comercial')
    can_access_admin boolean DEFAULT false, -- Pode logar no Admin?
    can_access_crm boolean DEFAULT false, -- Pode logar no CRM normal?
    allowed_pages jsonb DEFAULT '[]'::jsonb, -- Lista de rotas permitidas ex: ['/dashboard', '/kanban']
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Inserir configurações iniciais baseadas no que conversamos
INSERT INTO public.role_permissions (role, label, can_access_admin, can_access_crm, allowed_pages)
VALUES 
    ('admin', 'Administrador', true, true, '["*"]'), -- * indica acesso total
    ('user', 'Agência (Cliente)', false, true, '["/dashboard", "/kanban", "/leads"]'), -- Permissões do CRM normal (exemplo)
    ('comercial', 'Comercial (Interno)', true, false, '["/dashboard", "/kanban", "/empresas", "/promocoes", "/educacao", "/pesquisas"]'),
    ('financeiro', 'Financeiro (Interno)', true, false, '["/dashboard", "/relatorios"]')
ON CONFLICT (role) DO UPDATE SET
    allowed_pages = EXCLUDED.allowed_pages,
    can_access_admin = EXCLUDED.can_access_admin;

-- RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem editar, todos logados podem ler (para montar o menu)
CREATE POLICY "Admins podem gerenciar permissoes" ON public.role_permissions
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role' OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Usuarios podem ler permissoes" ON public.role_permissions
    FOR SELECT
    USING (true);
