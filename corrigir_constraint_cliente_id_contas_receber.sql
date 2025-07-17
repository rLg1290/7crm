-- Script para corrigir a constraint de cliente_id na tabela contas_receber
-- Execute este script no Supabase SQL Editor

-- 1. Verificar a constraint atual
SELECT 'Verificando constraint atual:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'contas_receber'::regclass 
AND conname LIKE '%cliente_id%';

-- 2. Verificar se a constraint existe
SELECT 'Constraint existe?' as info;
SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'contas_receber'::regclass 
    AND conname LIKE '%cliente_id%'
);

-- 3. Remover a constraint atual se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'contas_receber'::regclass 
        AND conname LIKE '%cliente_id%'
    ) THEN
        -- Remover a constraint existente
        ALTER TABLE contas_receber DROP CONSTRAINT IF EXISTS contas_receber_cliente_id_fkey;
        RAISE NOTICE 'Constraint contas_receber_cliente_id_fkey removida';
    ELSE
        RAISE NOTICE 'Nenhuma constraint de cliente_id encontrada para remover';
    END IF;
END $$;

-- 4. Verificar se a constraint foi removida
SELECT 'Constraint removida?' as info;
SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'contas_receber'::regclass 
    AND conname LIKE '%cliente_id%'
);

-- 5. Verificar a estrutura atual da tabela
SELECT 'Estrutura atual da tabela contas_receber:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contas_receber'
ORDER BY ordinal_position;

-- 6. Verificar se há dados na tabela
SELECT 'Dados existentes:' as info;
SELECT COUNT(*) as total_registros FROM contas_receber;

-- 7. Mostrar alguns registros para verificar
SELECT 'Registros de exemplo:' as info;
SELECT 
  id,
  empresa_id,
  cliente_id,
  cliente_nome,
  descricao,
  servico,
  valor,
  vencimento,
  status,
  created_at
FROM contas_receber
ORDER BY created_at DESC
LIMIT 5;

-- 8. Verificar se há registros com cliente_id inválido
SELECT 'Registros com cliente_id inválido:' as info;
SELECT 
  cr.id,
  cr.cliente_id,
  cr.cliente_nome,
  c.id as cliente_existe,
  f.id as fornecedor_existe
FROM contas_receber cr
LEFT JOIN clientes c ON cr.cliente_id = c.id::text
LEFT JOIN fornecedores f ON cr.cliente_id = f.id::text
WHERE cr.cliente_id IS NOT NULL
  AND c.id IS NULL 
  AND f.id IS NULL;

-- 9. Comentário sobre a solução
SELECT 'SOLUÇÃO IMPLEMENTADA:' as info;
SELECT 
  'A constraint foi removida para permitir que cliente_id aceite tanto IDs de clientes quanto de fornecedores.' as solucao,
  'O sistema agora usa o campo cliente_nome para identificar se é cliente ou fornecedor.' as explicacao,
  'Para comissões: cliente_id = ID do fornecedor, cliente_nome = nome do fornecedor' as exemplo_comissao,
  'Para contas: cliente_id = ID do cliente, cliente_nome = nome do cliente' as exemplo_conta; 