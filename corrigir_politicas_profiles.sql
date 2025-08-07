-- Script para corrigir políticas RLS da tabela profiles
-- Execute este script no SQL Editor do Supabase

-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Usuários podem ver apenas seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Permitir leitura de perfil durante autenticação" ON profiles;
DROP POLICY IF EXISTS "Leitura de perfis" ON profiles;

-- Criar política correta para leitura (permite durante autenticação)
CREATE POLICY "Leitura de perfis" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR  -- Usuário pode ver seu próprio perfil
    auth.uid() IS NULL  -- Permite leitura durante processo de autenticação
  );

-- Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- Testar se consegue ler a tabela profiles
SELECT id, email, role FROM profiles LIMIT 5;