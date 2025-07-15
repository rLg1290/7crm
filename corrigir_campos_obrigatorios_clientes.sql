-- Corrigir campos obrigatórios na tabela clientes
-- Tornar alguns campos opcionais para permitir cadastro via página pública

-- Alterar campos para permitir NULL
ALTER TABLE clientes ALTER COLUMN data_nascimento DROP NOT NULL;
ALTER TABLE clientes ALTER COLUMN cpf DROP NOT NULL;

-- Caso já tenham dados, verificar se há registros com campos vazios
UPDATE clientes SET data_nascimento = NULL WHERE data_nascimento = '';
UPDATE clientes SET cpf = NULL WHERE cpf = '';

-- Adicionar comentário explicativo
COMMENT ON TABLE clientes IS 'Tabela de clientes com campos flexíveis para cadastro via formulário público'; 