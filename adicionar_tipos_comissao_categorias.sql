-- Script para adicionar novos tipos de categoria: COMISSAOVENDA e COMISSAOCUSTO
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar a estrutura atual da tabela categorias
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'categorias'
ORDER BY ordinal_position;

-- 2. Verificar as constraints atuais da coluna tipo
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name IN (
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_name = 'categorias' 
    AND constraint_type = 'CHECK'
);

-- 3. Verificar o tipo enum atual (se existir)
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE t.typname LIKE '%categoria%' OR t.typname LIKE '%tipo%'
ORDER BY t.typname, e.enumsortorder;

-- 4. Remover constraint antiga (se existir)
DO $$
BEGIN
    -- Tentar remover constraint se existir
    BEGIN
        ALTER TABLE categorias DROP CONSTRAINT IF EXISTS categorias_tipo_check;
        RAISE NOTICE 'Constraint antiga removida com sucesso';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Nenhuma constraint encontrada ou erro ao remover: %', SQLERRM;
    END;
END $$;

-- 5. Adicionar nova constraint com os novos tipos
ALTER TABLE categorias 
ADD CONSTRAINT categorias_tipo_check 
CHECK (tipo IN ('CUSTO', 'VENDA', 'COMISSAOVENDA', 'COMISSAOCUSTO'));

-- 6. Verificar se a constraint foi aplicada
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name = 'categorias_tipo_check';

-- 7. Inserir algumas categorias de exemplo para os novos tipos
-- Primeiro verificar se já existem para evitar duplicatas
INSERT INTO categorias (nome, tipo, descricao, user_id) 
SELECT 'Comissão de Vendas', 'COMISSAOVENDA', 'Comissões pagas por vendas realizadas', NULL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Comissão de Vendas' AND tipo = 'COMISSAOVENDA');

INSERT INTO categorias (nome, tipo, descricao, user_id) 
SELECT 'Comissão de Parceiros', 'COMISSAOVENDA', 'Comissões pagas a parceiros comerciais', NULL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Comissão de Parceiros' AND tipo = 'COMISSAOVENDA');

INSERT INTO categorias (nome, tipo, descricao, user_id) 
SELECT 'Comissão de Marketing', 'COMISSAOCUSTO', 'Comissões pagas por marketing e divulgação', NULL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Comissão de Marketing' AND tipo = 'COMISSAOCUSTO');

INSERT INTO categorias (nome, tipo, descricao, user_id) 
SELECT 'Comissão de Representantes', 'COMISSAOCUSTO', 'Comissões pagas a representantes comerciais', NULL
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Comissão de Representantes' AND tipo = 'COMISSAOCUSTO');

-- 8. Verificar as categorias inseridas
SELECT id, nome, tipo, descricao, user_id 
FROM categorias 
WHERE tipo IN ('COMISSAOVENDA', 'COMISSAOCUSTO')
ORDER BY tipo, nome;

-- 9. Verificar todas as categorias por tipo
SELECT 
    tipo,
    COUNT(*) as quantidade,
    STRING_AGG(nome, ', ') as categorias
FROM categorias 
GROUP BY tipo 
ORDER BY tipo; 