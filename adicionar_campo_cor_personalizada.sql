-- Adicionar coluna cor_personalizada à tabela empresas
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS cor_personalizada VARCHAR(7);

-- Adicionar comentário explicativo
COMMENT ON COLUMN empresas.cor_personalizada IS 'Cor personalizada da empresa em formato hexadecimal (ex: #3B82F6)';

-- Atualizar empresas existentes com cor padrão
UPDATE empresas 
SET cor_personalizada = '#3B82F6' 
WHERE cor_personalizada IS NULL;

RAISE NOTICE 'Campo cor_personalizada adicionado com sucesso à tabela empresas!';