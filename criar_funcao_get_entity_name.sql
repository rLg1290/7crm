-- Script para criar a função get_entity_name_from_contas_receber
-- Esta função retorna o nome da entidade (cliente ou fornecedor) baseado nos campos da tabela

-- Criar a função
CREATE OR REPLACE FUNCTION get_entity_name_from_contas_receber(conta_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    cliente_id_val INTEGER;
    fornecedor_id_val INTEGER;
    nome_cliente TEXT;
    nome_fornecedor TEXT;
BEGIN
    -- Buscar os valores de cliente_id e fornecedor_id da conta
    SELECT cliente_id, fornecedor_id 
    INTO cliente_id_val, fornecedor_id_val
    FROM contas_receber 
    WHERE id = conta_id;
    
    -- Se não encontrou a conta, retornar null
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Se tem cliente_id, buscar o nome do cliente
    IF cliente_id_val IS NOT NULL THEN
        SELECT nome INTO nome_cliente
        FROM clientes 
        WHERE id = cliente_id_val;
        
        IF FOUND THEN
            RETURN nome_cliente;
        END IF;
    END IF;
    
    -- Se tem fornecedor_id, buscar o nome do fornecedor
    IF fornecedor_id_val IS NOT NULL THEN
        SELECT nome INTO nome_fornecedor
        FROM fornecedores 
        WHERE id = fornecedor_id_val;
        
        IF FOUND THEN
            RETURN nome_fornecedor;
        END IF;
    END IF;
    
    -- Se não encontrou nenhum nome, retornar 'Entidade não encontrada'
    RETURN 'Entidade não encontrada';
END;
$$ LANGUAGE plpgsql;

-- Verificar se a função foi criada
SELECT 
    proname as nome_funcao,
    proargtypes::regtype[] as tipos_argumentos,
    prorettype::regtype as tipo_retorno
FROM pg_proc 
WHERE proname = 'get_entity_name_from_contas_receber';

-- Testar a função (substitua o ID por um ID real da sua tabela contas_receber)
-- SELECT get_entity_name_from_contas_receber(1); 