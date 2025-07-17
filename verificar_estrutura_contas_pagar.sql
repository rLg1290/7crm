-- Script para verificar a estrutura da tabela contas_pagar
-- Execute este script no Supabase SQL Editor

-- 1. Verificar a estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contas_pagar' 
ORDER BY ordinal_position;

-- 2. Verificar se há constraints na coluna status
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'contas_pagar' 
    AND kcu.column_name = 'status';

-- 3. Verificar os valores únicos na coluna status
SELECT DISTINCT status, COUNT(*) as quantidade
FROM contas_pagar 
GROUP BY status 
ORDER BY status;

-- 4. Verificar as últimas contas criadas
SELECT 
    id,
    categoria_id,
    fornecedor_id,
    valor,
    vencimento,
    status,
    observacoes,
    created_at
FROM contas_pagar 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Verificar se há algum problema com valores nulos
SELECT 
    COUNT(*) as total_contas,
    COUNT(status) as contas_com_status,
    COUNT(*) - COUNT(status) as contas_sem_status
FROM contas_pagar; 