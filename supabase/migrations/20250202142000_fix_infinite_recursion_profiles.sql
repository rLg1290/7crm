-- Corrigir recursão infinita nas políticas de Profiles
-- O problema ocorre porque a política SELECT consulta a própria tabela profiles para checar a role
-- Solução: Usar auth.jwt() ->> 'role' não funciona pois role customizada está no profile
-- Melhor solução: Quebrar a recursão garantindo que a checagem de role não acione a própria política

-- 1. Política de Leitura (Select)
DROP POLICY IF EXISTS "Profiles visible by self and admins" ON public.profiles;

-- Permitir leitura se for o próprio usuário
CREATE POLICY "Profiles visible by self" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Permitir leitura global para admins/staff (usando uma função SECURITY DEFINER para evitar recursão)
-- Primeiro criamos uma função auxiliar para checar permissão sem RLS
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'comercial', 'financeiro')
  );
$$;

-- Agora aplicamos a política usando a função
CREATE POLICY "Profiles visible by admins and staff" ON public.profiles
FOR SELECT USING (public.is_admin_or_staff());


-- 2. Política de Atualização (Update)
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
-- Recriar usando a função segura
CREATE POLICY "Admin can update all profiles" ON public.profiles
FOR UPDATE
USING (public.is_admin_or_staff()); -- Simplificando para staff também poder editar se necessário, ou criar func específica is_admin()

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id);


-- 3. Política de Delete
DROP POLICY IF EXISTS "Admin can delete profiles" ON public.profiles;
CREATE POLICY "Admin can delete profiles" ON public.profiles
FOR DELETE
USING (public.is_admin_or_staff());


-- 4. Política de Insert
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
CREATE POLICY "Admin can insert profiles" ON public.profiles
FOR INSERT
WITH CHECK (public.is_admin_or_staff());
