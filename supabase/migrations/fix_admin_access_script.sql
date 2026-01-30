-- Script Completo para Corrigir Acesso Admin
-- Execute este script no SQL Editor do Supabase

-- 1. Garantir que a role 'admin' tenha permissões corretas na tabela role_permissions
INSERT INTO public.role_permissions (role, label, can_access_admin, can_access_crm, allowed_pages)
VALUES ('admin', 'Administrador', true, true, '["*"]')
ON CONFLICT (role) DO UPDATE SET
    can_access_admin = true,
    allowed_pages = '["*"]';

-- 2. Corrigir Políticas de Segurança (RLS) da tabela profiles
-- Isso garante que o usuário consiga ler seu próprio perfil para verificar a role
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de perfis" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 3. Função para promover um usuário a Admin pelo Email
-- Esta função cria o perfil se não existir e define a role como 'admin'
CREATE OR REPLACE FUNCTION promote_to_admin(target_email text)
RETURNS text AS $$
DECLARE
    target_user_id uuid;
BEGIN
    -- Buscar ID do usuário na tabela de autenticação
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
    
    IF target_user_id IS NULL THEN
        RETURN 'Erro: Usuário não encontrado na tabela auth.users. O usuário precisa se cadastrar/logar primeiro.';
    END IF;

    -- Inserir ou Atualizar perfil
    INSERT INTO public.profiles (id, email, role)
    VALUES (target_user_id, target_email, 'admin')
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin';
        
    RETURN 'Sucesso: Usuário ' || target_email || ' agora é Admin.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- 4. EXECUTE O COMANDO ABAIXO SUBSTITUINDO O EMAIL
-- =================================================================

-- SELECT promote_to_admin('email_do_seu_socio@exemplo.com');
