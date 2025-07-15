-- Script para corrigir políticas de RLS da tabela empresas
-- Este script resolve o problema de "Nenhum registro foi atualizado"

-- 1. Verificar se RLS está ativo na tabela empresas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'empresas';

-- 2. Verificar políticas existentes
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'empresas';

-- 3. Se houver políticas restritivas, vamos criar política para UPDATE
-- Permitir que usuários atualizem empresas onde são membros

-- Primeiro, remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem atualizar sua empresa" ON empresas;
DROP POLICY IF EXISTS "update_empresa_policy" ON empresas;
DROP POLICY IF EXISTS "Users can update their company" ON empresas;

-- Criar política de UPDATE para empresas
CREATE POLICY "Users can update their company" ON empresas
FOR UPDATE 
USING (
  -- Permitir update se o usuário pertence à empresa (conversão explícita para UUID)
  id = ((auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id')::uuid
)
WITH CHECK (
  -- Mesma condição para verificação (conversão explícita para UUID)
  id = ((auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id')::uuid
);

-- 4. Verificar se a política foi criada corretamente
SELECT 
    policyname, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'empresas' AND cmd = 'UPDATE';

-- 5. Teste direto de update (descomente e execute para testar)
-- UPDATE empresas 
-- SET cor_personalizada = '#FF0000' 
-- WHERE id = '8e23591e-e0af-42f8-a002-6df935bab14a';

-- 6. Verificar se o update funcionou
-- SELECT id, nome, cor_personalizada 
-- FROM empresas 
-- WHERE id = '8e23591e-e0af-42f8-a002-6df935bab14a';

-- 7. Se ainda não funcionar, vamos verificar se o usuário tem as permissões básicas
-- Verificar role do usuário atual
SELECT current_user, session_user;

-- 8. Se necessário, garantir permissões básicas na tabela
GRANT SELECT, UPDATE ON empresas TO authenticated;
GRANT SELECT, UPDATE ON empresas TO anon;

-- 9. Alternativa: Temporariamente desabilitar RLS para teste
-- ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
-- Execute o update via interface
-- ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE empresas IS 'Tabela de empresas com RLS configurado para updates por usuários da própria empresa'; 