-- Solução com campos separados cliente_id e fornecedor_id
-- Execute este script no Supabase SQL Editor

-- 1. Verificar a estrutura atual da tabela
SELECT 'Estrutura atual da tabela contas_receber:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contas_receber'
ORDER BY ordinal_position;

-- 2. Remover campo tipo_entidade se existir (não precisamos mais)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_receber' 
        AND column_name = 'tipo_entidade'
    ) THEN
        ALTER TABLE contas_receber DROP COLUMN tipo_entidade;
        RAISE NOTICE 'Campo tipo_entidade removido da tabela contas_receber';
    ELSE
        RAISE NOTICE 'Campo tipo_entidade não existe na tabela contas_receber';
    END IF;
END $$;

-- 3. Adicionar campo fornecedor_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_receber' 
        AND column_name = 'fornecedor_id'
    ) THEN
        ALTER TABLE contas_receber ADD COLUMN fornecedor_id INTEGER;
        RAISE NOTICE 'Campo fornecedor_id adicionado à tabela contas_receber';
    ELSE
        RAISE NOTICE 'Campo fornecedor_id já existe na tabela contas_receber';
    END IF;
END $$;

-- 4. Renomear cliente_id para ser mais específico (opcional)
-- Mantemos cliente_id como está para não quebrar o código existente

-- 5. Adicionar constraint para garantir que pelo menos um dos campos seja preenchido
DO $$
BEGIN
    -- Remover constraint se existir
    ALTER TABLE contas_receber DROP CONSTRAINT IF EXISTS contas_receber_cliente_ou_fornecedor_check;
    
    -- Adicionar nova constraint
    ALTER TABLE contas_receber ADD CONSTRAINT contas_receber_cliente_ou_fornecedor_check 
    CHECK (
        (cliente_id IS NOT NULL AND fornecedor_id IS NULL) OR 
        (cliente_id IS NULL AND fornecedor_id IS NOT NULL)
    );
    
    RAISE NOTICE 'Constraint adicionada: cliente_id OU fornecedor_id deve ser preenchido (não ambos)';
END $$;

-- 6. Verificar a estrutura final da tabela
SELECT 'Estrutura final da tabela contas_receber:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contas_receber'
ORDER BY ordinal_position;

-- 7. Verificar constraints da tabela
SELECT 'Constraints da tabela contas_receber:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'contas_receber'::regclass;

-- 8. Verificar dados existentes
SELECT 'Dados existentes na tabela contas_receber:' as info;
SELECT 
    id,
    cliente_id,
    fornecedor_id,
    descricao,
    valor,
    vencimento,
    status,
    created_at
FROM contas_receber
ORDER BY created_at DESC
LIMIT 10;

-- 9. Criar função para buscar nome da entidade
CREATE OR REPLACE FUNCTION get_entity_name_from_contas_receber(conta_id UUID)
RETURNS TEXT AS $$
DECLARE
    entity_name TEXT;
    cliente_id_val TEXT;
    fornecedor_id_val INTEGER;
BEGIN
    -- Buscar os IDs da conta
    SELECT cliente_id, fornecedor_id 
    INTO cliente_id_val, fornecedor_id_val
    FROM contas_receber 
    WHERE id = conta_id;
    
    -- Se tem cliente_id, buscar nome do cliente
    IF cliente_id_val IS NOT NULL THEN
        SELECT CONCAT(nome, ' ', COALESCE(sobrenome, '')) INTO entity_name
        FROM clientes 
        WHERE id = cliente_id_val::BIGINT;
        RETURN COALESCE(entity_name, 'Cliente não encontrado');
    END IF;
    
    -- Se tem fornecedor_id, buscar nome do fornecedor
    IF fornecedor_id_val IS NOT NULL THEN
        SELECT nome INTO entity_name
        FROM fornecedores 
        WHERE id = fornecedor_id_val;
        RETURN COALESCE(entity_name, 'Fornecedor não encontrado');
    END IF;
    
    RETURN 'Entidade não encontrada';
END;
$$ LANGUAGE plpgsql;

-- 10. Testar a função
SELECT 'Testando função get_entity_name_from_contas_receber:' as info;
SELECT 
    id,
    cliente_id,
    fornecedor_id,
    get_entity_name_from_contas_receber(id) as nome_entidade
FROM contas_receber
ORDER BY created_at DESC
LIMIT 5;

-- 11. Comentário sobre a solução implementada
SELECT 'SOLUÇÃO IMPLEMENTADA:' as info;
SELECT 
    'Campos separados: cliente_id (TEXT) e fornecedor_id (INTEGER)' as estrutura,
    'Constraint: cliente_id OU fornecedor_id deve ser preenchido (não ambos)' as validacao,
    'Função get_entity_name_from_contas_receber() criada para buscar nomes' as funcao,
    'Sem conflitos de ID entre tabelas' as beneficio; 