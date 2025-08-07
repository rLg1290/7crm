-- Script para migrar usuários existentes para a tabela profiles
-- Execute este script APENAS UMA VEZ após criar a tabela profiles

-- 1. Primeiro, vamos inserir todos os usuários existentes na tabela profiles
INSERT INTO profiles (id, email, role, empresa_id, created_at)
SELECT 
  id,
  email,
  'user' as role, -- Todos começam como 'user' por padrão
  CASE 
    WHEN raw_user_meta_data->>'empresa_id' IS NOT NULL 
    THEN (raw_user_meta_data->>'empresa_id')::UUID
    ELSE NULL
  END as empresa_id,
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);

-- 2. Verificar quantos usuários foram migrados
SELECT 
  COUNT(*) as total_usuarios_migrados,
  COUNT(CASE WHEN empresa_id IS NOT NULL THEN 1 END) as usuarios_com_empresa
FROM profiles;

-- 3. Listar todos os usuários para verificação
SELECT 
  p.id,
  p.email,
  p.role,
  p.empresa_id,
  e.nome as empresa_nome,
  e.codigo_agencia,
  p.created_at
FROM profiles p
LEFT JOIN empresas e ON p.empresa_id = e.id
ORDER BY p.created_at;

-- 4. DEFINIR ROLES DOS USUÁRIOS
-- Substitua os emails pelos emails reais dos seus usuários

-- Exemplo: Tornar um usuário específico administrador
-- DESCOMENTE E MODIFIQUE O EMAIL ABAIXO:
/*
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'seu-email-admin@exemplo.com';
*/

-- Exemplo: Tornar múltiplos usuários administradores
-- DESCOMENTE E MODIFIQUE OS EMAILS ABAIXO:
/*
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'admin1@exemplo.com',
  'admin2@exemplo.com',
  'admin3@exemplo.com'
);
*/

-- 5. Verificar usuários administradores
SELECT 
  p.email,
  p.role,
  e.nome as empresa_nome
FROM profiles p
LEFT JOIN empresas e ON p.empresa_id = e.id
WHERE p.role = 'admin';

-- 6. Estatísticas finais
SELECT 
  role,
  COUNT(*) as quantidade
FROM profiles
GROUP BY role;

-- 7. COMANDOS ÚTEIS PARA GERENCIAR ROLES

-- Ver todos os usuários e suas roles:
-- SELECT email, role FROM profiles ORDER BY role, email;

-- Tornar um usuário admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'email@exemplo.com';

-- Tornar um usuário comum:
-- UPDATE profiles SET role = 'user' WHERE email = 'email@exemplo.com';

-- Ver usuários sem empresa:
-- SELECT email, role FROM profiles WHERE empresa_id IS NULL;

-- Associar usuário a uma empresa:
-- UPDATE profiles SET empresa_id = 'uuid-da-empresa' WHERE email = 'email@exemplo.com';

-- IMPORTANTE: Após executar este script, teste o login no sistema administrativo
-- com um usuário que tenha role = 'admin'