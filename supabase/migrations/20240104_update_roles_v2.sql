-- Atualizar a constraint de role na tabela profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'admin', 'comercial', 'financeiro'));

-- Comentário atualizado
COMMENT ON COLUMN public.profiles.role IS 'user: Agência/Cliente, admin: Super Admin, comercial/financeiro: Funcionários Internos (7CRM Admin)';
