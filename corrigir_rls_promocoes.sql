-- Script para corrigir a política RLS da tabela promocoes
-- O problema é que a política atual usa auth.uid() mas deveria verificar o empresa_id do usuário

-- Remover a política atual
DROP POLICY IF EXISTS "Empresas podem ver apenas suas próprias promoções" ON promocoes;

-- Criar nova política correta para SELECT
CREATE POLICY "Empresas podem ver suas promoções" ON promocoes
    FOR SELECT USING (
        empresa_id = ((auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id')::uuid
    );

-- Criar política para INSERT
CREATE POLICY "Empresas podem criar promoções" ON promocoes
    FOR INSERT WITH CHECK (
        empresa_id = ((auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id')::uuid
    );

-- Criar política para UPDATE
CREATE POLICY "Empresas podem atualizar suas promoções" ON promocoes
    FOR UPDATE USING (
        empresa_id = ((auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id')::uuid
    ) WITH CHECK (
        empresa_id = ((auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id')::uuid
    );

-- Criar política para DELETE
CREATE POLICY "Empresas podem deletar suas promoções" ON promocoes
    FOR DELETE USING (
        empresa_id = ((auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id')::uuid
    );

-- Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'promocoes';