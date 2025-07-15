-- Adicionar campo cor_personalizada na tabela empresas
-- Este campo permitirá que cada agência personalize a cor da página pública de solicitação de orçamento

-- Adicionar coluna cor_personalizada
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS cor_personalizada VARCHAR(7);

-- Adicionar comentário na coluna
COMMENT ON COLUMN empresas.cor_personalizada IS 'Cor personalizada da página pública em formato hexadecimal (ex: #3B82F6)';

-- Verificar se a coluna foi criada corretamente
SELECT column_name, data_type, character_maximum_length, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'empresas' 
AND column_name = 'cor_personalizada';

-- Exemplo de atualização para definir uma cor padrão (opcional)
-- UPDATE empresas SET cor_personalizada = '#3B82F6' WHERE cor_personalizada IS NULL; 