-- Script para adicionar campo categoria_id à tabela contas_receber
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o campo categoria_id já existe
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_name = 'contas_receber'
   AND column_name = 'categoria_id'
);

-- 2. Adicionar campo categoria_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_receber'
        AND column_name = 'categoria_id'
    ) THEN
        ALTER TABLE contas_receber ADD COLUMN categoria_id INTEGER;
        RAISE NOTICE 'Campo categoria_id adicionado à tabela contas_receber';
    ELSE
        RAISE NOTICE 'Campo categoria_id já existe na tabela contas_receber';
    END IF;
END $$;

-- 3. Verificar a estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contas_receber'
ORDER BY ordinal_position;

-- 4. Verificar se há dados na tabela
SELECT COUNT(*) as total_registros FROM contas_receber;

-- 5. Mostrar alguns registros para verificar
SELECT 
  id,
  empresa_id,
  cliente_id,
  cliente_nome,
  categoria_id,
  descricao,
  servico,
  valor,
  vencimento,
  status,
  created_at
FROM contas_receber
ORDER BY created_at DESC
LIMIT 5; 