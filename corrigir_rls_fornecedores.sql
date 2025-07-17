-- Script para corrigir as políticas RLS da tabela fornecedores
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela fornecedores existe
SELECT 'Tabela fornecedores existe:' as status, 
       EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public'
         AND table_name = 'fornecedores'
       ) as existe;

-- 2. Verificar se RLS está habilitado
SELECT 'RLS habilitado:' as status,
       schemaname,
       tablename,
       rowsecurity
FROM pg_tables 
WHERE tablename = 'fornecedores';

-- 3. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Usuários podem ver fornecedores globais e da sua empresa" ON fornecedores;
DROP POLICY IF EXISTS "Usuários podem inserir fornecedores para sua empresa" ON fornecedores;
DROP POLICY IF EXISTS "Usuários podem atualizar fornecedores da sua empresa" ON fornecedores;
DROP POLICY IF EXISTS "Usuários podem deletar fornecedores da sua empresa" ON fornecedores;

-- 4. Criar políticas RLS corrigidas
-- Política para SELECT: Usuários podem ver fornecedores globais e da sua empresa
CREATE POLICY "Usuários podem ver fornecedores globais e da sua empresa" ON fornecedores
    FOR SELECT USING (
        empresa_id IS NULL OR 
        empresa_id IN (
            SELECT empresa_id FROM usuarios_empresas 
            WHERE usuario_id = auth.uid()
        )
    );

-- Política para INSERT: Usuários podem inserir fornecedores para sua empresa
CREATE POLICY "Usuários podem inserir fornecedores para sua empresa" ON fornecedores
    FOR INSERT WITH CHECK (
        empresa_id IN (
            SELECT empresa_id FROM usuarios_empresas 
            WHERE usuario_id = auth.uid()
        )
    );

-- Política para UPDATE: Usuários podem atualizar fornecedores da sua empresa
CREATE POLICY "Usuários podem atualizar fornecedores da sua empresa" ON fornecedores
    FOR UPDATE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios_empresas 
            WHERE usuario_id = auth.uid()
        )
    );

-- Política para DELETE: Usuários podem deletar fornecedores da sua empresa
CREATE POLICY "Usuários podem deletar fornecedores da sua empresa" ON fornecedores
    FOR DELETE USING (
        empresa_id IN (
            SELECT empresa_id FROM usuarios_empresas 
            WHERE usuario_id = auth.uid()
        )
    );

-- 5. Verificar políticas criadas
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
WHERE tablename = 'fornecedores'
ORDER BY policyname;

-- 6. Testar se o usuário atual tem empresa
SELECT 
    'Usuário atual tem empresa:' as status,
    auth.uid() as user_id,
    ue.empresa_id,
    e.nome as empresa_nome
FROM usuarios_empresas ue
JOIN empresas e ON e.id = ue.empresa_id
WHERE ue.usuario_id = auth.uid();

-- 7. Verificar fornecedores existentes
SELECT 
    id,
    nome,
    cnpj,
    email,
    telefone,
    CASE 
        WHEN empresa_id IS NULL THEN 'Global'
        ELSE 'Empresa Específica'
    END as tipo,
    empresa_id,
    created_at
FROM fornecedores 
ORDER BY nome; 