-- Script para remover o campo cliente_nome da tabela contas_receber
-- Este campo está causando erro pois não existe no cache do esquema

-- 1. Verificar se o campo existe
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'contas_receber' 
    AND column_name = 'cliente_nome';

-- 2. Remover o campo cliente_nome se existir
ALTER TABLE contas_receber 
DROP COLUMN IF EXISTS cliente_nome;

-- 3. Verificar estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contas_receber'
ORDER BY ordinal_position;

-- 4. Verificar dados existentes
SELECT COUNT(*) as total_contas_receber FROM contas_receber;

-- 5. Mostrar alguns registros de exemplo
SELECT 
    id,
    cliente_id,
    descricao,
    valor,
    status,
    empresa_id
FROM contas_receber 
LIMIT 5;