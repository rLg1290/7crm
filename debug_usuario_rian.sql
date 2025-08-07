-- Script para debugar especificamente o usuário rian1290@hotmail.com
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar usuário na tabela auth.users
SELECT 
    'AUTH.USERS' as tabela,
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = 'rian1290@hotmail.com';

-- 2. Verificar usuário na tabela profiles
SELECT 
    'PROFILES' as tabela,
    id,
    email,
    role,
    empresa_id,
    created_at
FROM profiles 
WHERE email = 'rian1290@hotmail.com';

-- 3. Verificar se os IDs coincidem
SELECT 
    'COMPARACAO_IDS' as verificacao,
    u.id as auth_id,
    p.id as profile_id,
    CASE 
        WHEN u.id = p.id THEN 'IDs COINCIDEM ✅'
        ELSE 'IDs DIFERENTES ❌'
    END as status
FROM auth.users u
FULL OUTER JOIN profiles p ON u.id = p.id
WHERE u.email = 'rian1290@hotmail.com' OR p.email = 'rian1290@hotmail.com';

-- 4. Verificar políticas RLS da tabela profiles
SELECT 
    'POLITICAS_RLS' as verificacao,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 5. Testar consulta como seria feita pelo sistema
-- (simula a consulta que o LoginPage.tsx faz)
SELECT 
    'TESTE_CONSULTA' as verificacao,
    id,
    email,
    role,
    empresa_id
FROM profiles 
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'rian1290@hotmail.com'
);

-- 6. Verificar se RLS está habilitado
SELECT 
    'RLS_STATUS' as verificacao,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 7. Forçar criação/atualização do perfil se necessário
-- Execute apenas se os passos anteriores mostrarem problemas

-- Deletar perfil existente (se houver problema)
-- DELETE FROM profiles WHERE email = 'rian1290@hotmail.com';

-- Recriar perfil
INSERT INTO profiles (id, email, role, empresa_id)
SELECT 
    id,
    email,
    'admin' as role,
    NULL as empresa_id
FROM auth.users 
WHERE email = 'rian1290@hotmail.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    email = EXCLUDED.email,
    updated_at = NOW();

-- 8. Verificação final
SELECT 
    'VERIFICACAO_FINAL' as status,
    u.email as auth_email,
    p.email as profile_email,
    p.role,
    CASE 
        WHEN p.role = 'admin' THEN 'LOGIN DEVE FUNCIONAR ✅'
        ELSE 'PROBLEMA PERSISTE ❌'
    END as resultado
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'rian1290@hotmail.com';