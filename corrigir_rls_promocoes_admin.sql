-- Script para corrigir políticas RLS da tabela promocoes
-- Promoções são criadas por admins e todas as empresas podem ver

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Empresas podem ver suas promoções" ON promocoes;
DROP POLICY IF EXISTS "Empresas podem criar promoções" ON promocoes;
DROP POLICY IF EXISTS "Empresas podem atualizar suas promoções" ON promocoes;
DROP POLICY IF EXISTS "Empresas podem deletar suas promoções" ON promocoes;
DROP POLICY IF EXISTS "Empresas podem ver apenas suas próprias promoções" ON promocoes;

-- Criar política para SELECT - TODAS as empresas podem ver TODAS as promoções
CREATE POLICY "Todas empresas podem ver promoções" ON promocoes
    FOR SELECT USING (true);

-- Criar política para INSERT - Apenas admins podem criar promoções
CREATE POLICY "Admins podem criar promoções" ON promocoes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Criar política para UPDATE - Apenas admins podem atualizar promoções
CREATE POLICY "Admins podem atualizar promoções" ON promocoes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Criar política para DELETE - Apenas admins podem deletar promoções
CREATE POLICY "Admins podem deletar promoções" ON promocoes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Verificar as políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'promocoes'
ORDER BY policyname;

-- Testar se consegue ver promoções
SELECT COUNT(*) as total_promocoes FROM promocoes;