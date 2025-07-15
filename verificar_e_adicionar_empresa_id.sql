-- Script para verificar e adicionar o campo empresa_id
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o campo empresa_id existe
SELECT 'Verificando campo empresa_id:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fornecedores' 
AND column_name = 'empresa_id';

-- 2. Adicionar campo se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fornecedores' AND column_name = 'empresa_id'
    ) THEN
        ALTER TABLE fornecedores ADD COLUMN empresa_id UUID NULL;
        RAISE NOTICE 'Campo empresa_id adicionado com sucesso!';
    ELSE
        RAISE NOTICE 'Campo empresa_id já existe!';
    END IF;
END $$;

-- 3. Verificar estrutura final
SELECT 'Estrutura final da tabela fornecedores:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position;

-- 4. Verificar dados existentes
SELECT 'Dados na tabela fornecedores:' as info;
SELECT id, nome, user_id, empresa_id, created_at
FROM fornecedores 
ORDER BY nome;

SELECT 'Script executado com sucesso!' as resultado; 