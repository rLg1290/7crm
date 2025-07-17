-- Solução para conflito de IDs entre clientes e fornecedores
-- Execute este script no Supabase SQL Editor

-- 1. Verificar a situação atual
SELECT 'Verificando conflitos de ID:' as info;
SELECT 
    'clientes' as tabela,
    MIN(id) as min_id,
    MAX(id) as max_id,
    COUNT(*) as total_registros
FROM clientes
UNION ALL
SELECT 
    'fornecedores' as tabela,
    MIN(id) as min_id,
    MAX(id) as max_id,
    COUNT(*) as total_registros
FROM fornecedores;

-- 2. Verificar se há IDs duplicados
SELECT 'IDs duplicados entre clientes e fornecedores:' as info;
SELECT 
    c.id as cliente_id,
    c.nome as cliente_nome,
    f.id as fornecedor_id,
    f.nome as fornecedor_nome
FROM clientes c
INNER JOIN fornecedores f ON c.id = f.id;

-- 3. Adicionar campo tipo_entidade à tabela contas_receber
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_receber' 
        AND column_name = 'tipo_entidade'
    ) THEN
        ALTER TABLE contas_receber ADD COLUMN tipo_entidade VARCHAR(20) DEFAULT 'cliente';
        RAISE NOTICE 'Campo tipo_entidade adicionado à tabela contas_receber';
    ELSE
        RAISE NOTICE 'Campo tipo_entidade já existe na tabela contas_receber';
    END IF;
END $$;

-- 4. Atualizar registros existentes para definir o tipo_entidade
UPDATE contas_receber 
SET tipo_entidade = 'cliente' 
WHERE tipo_entidade IS NULL;

-- 5. Verificar a estrutura atual da tabela contas_receber
SELECT 'Estrutura atual da tabela contas_receber:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contas_receber'
ORDER BY ordinal_position;

-- 6. Criar função para buscar nome da entidade
CREATE OR REPLACE FUNCTION get_entity_name(entity_id TEXT, entity_type VARCHAR(20))
RETURNS TEXT AS $$
DECLARE
    entity_name TEXT;
BEGIN
    IF entity_type = 'cliente' THEN
        SELECT CONCAT(nome, ' ', COALESCE(sobrenome, '')) INTO entity_name
        FROM clientes 
        WHERE id = entity_id::BIGINT;
    ELSIF entity_type = 'fornecedor' THEN
        SELECT nome INTO entity_name
        FROM fornecedores 
        WHERE id = entity_id::INTEGER;
    ELSE
        entity_name := 'Entidade não encontrada';
    END IF;
    
    RETURN COALESCE(entity_name, 'Entidade não encontrada');
END;
$$ LANGUAGE plpgsql;

-- 7. Testar a função
SELECT 'Testando função get_entity_name:' as info;
SELECT 
    'Cliente ID 1' as teste,
    get_entity_name('1', 'cliente') as nome_entidade
UNION ALL
SELECT 
    'Fornecedor ID 1' as teste,
    get_entity_name('1', 'fornecedor') as nome_entidade;

-- 8. Verificar dados atuais na tabela contas_receber
SELECT 'Dados atuais na tabela contas_receber:' as info;
SELECT 
    id,
    cliente_id,
    tipo_entidade,
    cliente_nome,
    descricao,
    valor,
    vencimento,
    status,
    created_at
FROM contas_receber
ORDER BY created_at DESC
LIMIT 10;

-- 9. Comentário sobre a solução implementada
SELECT 'SOLUÇÃO IMPLEMENTADA:' as info;
SELECT 
    'Campo tipo_entidade adicionado para distinguir entre clientes e fornecedores' as solucao,
    'tipo_entidade = ''cliente'' para contas normais' as exemplo_cliente,
    'tipo_entidade = ''fornecedor'' para comissões' as exemplo_fornecedor,
    'Função get_entity_name() criada para buscar nomes corretamente' as funcao_criada; 