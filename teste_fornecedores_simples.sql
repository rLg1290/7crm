-- Verificar se a tabela fornecedores existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'fornecedores'
) as tabela_existe;

-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fornecedores' 
ORDER BY ordinal_position;

-- Verificar fornecedores existentes
SELECT COUNT(*) as total_fornecedores FROM fornecedores;

-- Inserir fornecedores globais de teste
INSERT INTO fornecedores (nome, cnpj, email, telefone, cidade, estado)
VALUES 
    ('Fornecedor Teste 1', '12.345.678/0001-90', 'teste1@email.com', '(11) 99999-1111', 'São Paulo', 'SP'),
    ('Fornecedor Teste 2', '98.765.432/0001-10', 'teste2@email.com', '(11) 99999-2222', 'Rio de Janeiro', 'RJ'),
    ('Fornecedor Teste 3', '11.222.333/0001-44', 'teste3@email.com', '(11) 99999-3333', 'Belo Horizonte', 'MG')
ON CONFLICT (id) DO NOTHING;

-- Verificar fornecedores após inserção
SELECT id, nome, cnpj, email, telefone, cidade, estado, user_id, empresa_id
FROM fornecedores 
ORDER BY nome; 