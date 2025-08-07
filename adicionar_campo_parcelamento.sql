-- Script SQL para adicionar o campo parcelamento à tabela cotacoes
-- Execute este script no Supabase SQL Editor

-- Adicionar campo parcelamento à tabela cotacoes
ALTER TABLE cotacoes 
ADD COLUMN IF NOT EXISTS parcelamento VARCHAR(10) DEFAULT '1';

-- Criar comentário para documentar o campo
COMMENT ON COLUMN cotacoes.parcelamento IS 'Número de vezes/parcelas para pagamento da cotação';

-- Criar índice para melhor performance (opcional)
CREATE INDEX IF NOT EXISTS idx_cotacoes_parcelamento ON cotacoes(parcelamento);

-- Atualizar registros existentes que não têm parcelamento definido
UPDATE cotacoes 
SET parcelamento = '1'
WHERE parcelamento IS NULL;

-- Verificar se o campo foi adicionado corretamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cotacoes' AND column_name = 'parcelamento';

-- Verificar alguns registros para confirmar
SELECT id, titulo, parcelamento 
FROM cotacoes 
LIMIT 5;