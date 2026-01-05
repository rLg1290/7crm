-- Atualizar a constraint de role na tabela profiles para aceitar 'manager'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('user', 'manager', 'admin'));

-- Comentário para documentar os roles
COMMENT ON COLUMN public.profiles.role IS 'user: Usuário Comum do CRM, manager: Administrador da Agência (CRM), admin: Usuário do Sistema Admin (7CRM)';
