-- Script para adicionar apenas o campo empresa_id à tabela fornecedores
-- Execute este script no Supabase SQL Editor

-- Verificar se a coluna empresa_id já existe
SELECT 'Coluna empresa_id existe:' as status,
       EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = 'fornecedores' 
         AND column_name = 'empresa_id'
       ) as existe;

-- Adicionar coluna empresa_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fornecedores' AND column_name = 'empresa_id'
    ) THEN
        ALTER TABLE fornecedores ADD COLUMN empresa_id UUID NULL;
        RAISE NOTICE 'Coluna empresa_id adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna empresa_id já existe';
    END IF;
END $$;

-- Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position;

-- Verificar dados existentes
SELECT 'Dados na tabela:' as info;
SELECT id, nome, cnpj, email, telefone, user_id, empresa_id, created_at
FROM fornecedores 
ORDER BY nome;

SELECT 'Script executado com sucesso!' as resultado; 