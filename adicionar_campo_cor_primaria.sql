-- Adicionar campo cor_primaria à tabela empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cor_primaria VARCHAR(7) DEFAULT '#3B82F6';

-- Comentário explicativo
COMMENT ON COLUMN empresas.cor_primaria IS 'Cor primária usada nas promoções e materiais de marketing da empresa (formato hexadecimal #RRGGBB)';

-- Verificar se o campo foi adicionado corretamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'empresas' 
AND column_name IN ('cor_primaria', 'cor_secundaria', 'cor_personalizada')
ORDER BY column_name;