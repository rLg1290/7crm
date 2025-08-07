-- Script para remover o campo servico da tabela contas_receber
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o campo servico existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contas_receber' 
AND column_name = 'servico';

-- 2. Remover o campo servico se existir
ALTER TABLE contas_receber 
DROP COLUMN IF EXISTS servico;

-- 3. Verificar a estrutura final da tabela
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contas_receber' 
ORDER BY ordinal_position;

-- 4. Exibir alguns dados de exemplo para verificar
SELECT id, descricao, categoria_id, valor, vencimento, status
FROM contas_receber 
LIMIT 5;