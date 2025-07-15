-- Corrigir constraint NOT NULL do campo data_nascimento
-- Permitir valores NULL para data_nascimento, cpf e outros campos opcionais

ALTER TABLE clientes 
ALTER COLUMN data_nascimento DROP NOT NULL;

ALTER TABLE clientes 
ALTER COLUMN cpf DROP NOT NULL;

-- Verificar se os campos já permitem NULL
-- Se não, adicionar comentário explicativo
COMMENT ON COLUMN clientes.data_nascimento IS 'Data de nascimento (opcional)';
COMMENT ON COLUMN clientes.cpf IS 'CPF (opcional)'; 