-- Script para corrigir recursão infinita nas políticas RLS da tabela profiles
-- Execute este script no SQL Editor do Supabase

-- Desabilitar RLS temporariamente para limpeza
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver apenas seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Permitir leitura de perfil durante autenticação" ON profiles;
DROP POLICY IF EXISTS "Leitura de perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Administradores podem gerenciar todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Permitir inserção de novos perfis" ON profiles;

-- Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar política simples para SELECT (sem recursão)
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (true);

-- Criar política para INSERT
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Criar política para UPDATE
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Testar consulta
SELECT id, email, role FROM profiles WHERE email = 'rian1290@hotmail.com';

-- Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';