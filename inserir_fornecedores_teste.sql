-- Inserir fornecedores globais de teste (user_id IS NULL)
INSERT INTO fornecedores (nome, cnpj, email, telefone, cidade, estado, endereco, cep, observacoes)
VALUES 
    ('Fornecedor Global 1', '12.345.678/0001-90', 'contato@global1.com', '(11) 99999-1111', 'São Paulo', 'SP', 'Rua das Flores, 123', '01234-567', 'Fornecedor global de teste'),
    ('Fornecedor Global 2', '98.765.432/0001-10', 'contato@global2.com', '(11) 99999-2222', 'Rio de Janeiro', 'RJ', 'Av. Copacabana, 456', '22070-001', 'Fornecedor global de teste'),
    ('Fornecedor Global 3', '11.222.333/0001-44', 'contato@global3.com', '(11) 99999-3333', 'Belo Horizonte', 'MG', 'Rua da Liberdade, 789', '30112-000', 'Fornecedor global de teste')
ON CONFLICT (id) DO NOTHING;

-- Verificar fornecedores após inserção
SELECT 
    id,
    nome,
    cnpj,
    email,
    telefone,
    cidade,
    estado,
    user_id,
    created_at
FROM fornecedores 
ORDER BY nome; 