-- Script para adicionar o campo imagem à tabela promocoes
-- Execute este script no Supabase para adicionar o campo imagem

ALTER TABLE promocoes ADD COLUMN imagem TEXT;

-- Comentário do campo
COMMENT ON COLUMN promocoes.imagem IS 'URL da imagem da promoção';

-- Verificar se o campo foi adicionado
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'promocoes' AND column_name = 'imagem';