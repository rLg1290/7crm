-- Script para verificar e corrigir problema de login admin
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela profiles existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'profiles'
);

-- 2. Verificar usuários na tabela auth.users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar se existem perfis na tabela profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- 4. Ver todos os perfis existentes
SELECT id, email, role, empresa_id, created_at
FROM profiles
ORDER BY created_at DESC;

-- 5. Verificar se seu usuário específico existe na tabela profiles
-- SUBSTITUA 'seu-email@exemplo.com' pelo seu email real
SELECT p.id, p.email, p.role, p.empresa_id, u.email_confirmed_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email = 'seu-email@exemplo.com';

-- 6. Se o usuário não existir na tabela profiles, criar o perfil
-- SUBSTITUA 'seu-email@exemplo.com' pelo seu email real
INSERT INTO profiles (id, email, role, empresa_id)
SELECT 
    u.id,
    u.email,
    'admin' as role,
    NULL as empresa_id
FROM auth.users u
WHERE u.email = 'seu-email@exemplo.com'
AND u.id NOT IN (SELECT id FROM profiles);

-- 7. Se o usuário existir mas não for admin, atualizar para admin
-- SUBSTITUA 'seu-email@exemplo.com' pelo seu email real
UPDATE profiles 
SET role = 'admin'
WHERE email = 'seu-email@exemplo.com'
AND role != 'admin';

-- 8. Verificar se a correção funcionou
-- SUBSTITUA 'seu-email@exemplo.com' pelo seu email real
SELECT 
    p.id,
    p.email,
    p.role,
    p.empresa_id,
    'SUCCESS - Usuário é admin' as status
FROM profiles p
WHERE p.email = 'seu-email@exemplo.com'
AND p.role = 'admin';

-- 9. Verificar políticas RLS da tabela profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 10. Testar se consegue ler a tabela profiles (deve funcionar)
SELECT 'Teste de leitura OK' as resultado, COUNT(*) as total_registros
FROM profiles;