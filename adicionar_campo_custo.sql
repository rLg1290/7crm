-- Script SQL para adicionar o campo custo à tabela cotacoes
-- Execute este script no Supabase SQL Editor

-- Adicionar campo custo à tabela cotacoes
ALTER TABLE cotacoes 
ADD COLUMN IF NOT EXISTS custo DECIMAL(10,2) DEFAULT 0;

-- Criar comentário para documentar o campo
COMMENT ON COLUMN cotacoes.custo IS 'Valor total dos custos da cotação';

-- Criar índice para melhor performance (opcional)
CREATE INDEX IF NOT EXISTS idx_cotacoes_custo ON cotacoes(custo);

-- Atualizar registros existentes que não têm custo definido
UPDATE cotacoes 
SET custo = 0
WHERE custo IS NULL;

-- Verificar se o campo foi adicionado corretamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cotacoes' AND column_name = 'custo';

-- Verificar alguns registros para confirmar
SELECT id, titulo, valor, custo 
FROM cotacoes 
LIMIT 5;