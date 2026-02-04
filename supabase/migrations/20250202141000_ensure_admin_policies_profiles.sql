-- Garantir que políticas de Profiles permitam acesso aos Admins e Equipe Interna

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Política de Leitura (Select)
DROP POLICY IF EXISTS "Profiles visible by self and admins" ON public.profiles;
CREATE POLICY "Profiles visible by self and admins" ON public.profiles
FOR SELECT
USING (
  auth.uid() = id -- Próprio usuário
  OR
  EXISTS ( -- Ou é admin/interno
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'comercial', 'financeiro')
  )
);

-- 2. Política de Atualização (Update)
-- Admin pode atualizar qualquer um via UI (embora a função RPC faça isso, o frontend pode tentar update direto em alguns casos de edição)
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
CREATE POLICY "Admin can update all profiles" ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Usuário comum atualiza seu próprio
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- 3. Política de Delete
DROP POLICY IF EXISTS "Admin can delete profiles" ON public.profiles;
CREATE POLICY "Admin can delete profiles" ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Nota: Insert é geralmente feito via Trigger on auth.users ou pela RPC admin_create_user (que bypassa RLS).
-- Mas se precisarmos de insert direto:
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
CREATE POLICY "Admin can insert profiles" ON public.profiles
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);
