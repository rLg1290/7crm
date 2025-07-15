-- Adicionar campo codigo à tabela cotacoes existente
ALTER TABLE cotacoes 
ADD COLUMN IF NOT EXISTS codigo VARCHAR(6) UNIQUE;

-- Adicionar campo de custo
ALTER TABLE cotacoes 
ADD COLUMN IF NOT EXISTS custo DECIMAL(10,2);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_cotacoes_codigo ON cotacoes(codigo);

-- Atualizar registros existentes com códigos únicos
UPDATE cotacoes 
SET codigo = CONCAT('COT', LPAD(id::text, 4, '0'))
WHERE codigo IS NULL;

-- Tornar o campo NOT NULL após preencher todos os registros
ALTER TABLE cotacoes 
ALTER COLUMN codigo SET NOT NULL; 