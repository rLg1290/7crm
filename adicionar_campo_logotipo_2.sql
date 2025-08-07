-- Script para adicionar o campo logotipo_2 à tabela empresas
-- Execute este script no Supabase para adicionar o novo campo de logo

ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logotipo_2 TEXT;

-- Comentário do campo
COMMENT ON COLUMN empresas.logotipo_2 IS 'URL da segunda logo da empresa (para promoções)';

-- Verificar se o campo foi adicionado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'empresas' AND column_name IN ('logotipo', 'logotipo_2')
ORDER BY column_name;

-- Mostrar estrutura atual da tabela
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'empresas'
ORDER BY ordinal_position;

RAISE NOTICE 'Campo logotipo_2 adicionado com sucesso à tabela empresas!';