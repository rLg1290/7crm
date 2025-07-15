-- Script corrigido para inserir fornecedores de teste
-- Primeiro verifica a estrutura da tabela e depois insere dados

-- Verificar a estrutura atual da tabela fornecedores
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position;

-- Inserir fornecedores globais de teste (user_id IS NULL)
-- Usando apenas as colunas que existem na tabela
INSERT INTO fornecedores (nome, cnpj, email, telefone, user_id)
VALUES 
    ('Fornecedor Global 1', '12.345.678/0001-90', 'contato@global1.com', '(11) 99999-1111', NULL),
    ('Fornecedor Global 2', '98.765.432/0001-10', 'contato@global2.com', '(11) 99999-2222', NULL),
    ('Fornecedor Global 3', '11.222.333/0001-44', 'contato@global3.com', '(11) 99999-3333', NULL)
ON CONFLICT (id) DO NOTHING;

-- Verificar fornecedores após inserção
SELECT 
    id,
    nome,
    cnpj,
    email,
    telefone,
    user_id,
    created_at
FROM fornecedores 
ORDER BY nome; 