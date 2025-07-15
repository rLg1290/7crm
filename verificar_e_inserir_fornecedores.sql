-- Verificar estrutura da tabela fornecedores
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fornecedores' 
ORDER BY ordinal_position;

-- Verificar fornecedores existentes
SELECT 
    id,
    nome,
    cnpj,
    email,
    telefone,
    cidade,
    estado,
    user_id,
    empresa_id,
    created_at
FROM fornecedores 
ORDER BY nome;

-- Inserir fornecedores globais de teste (user_id IS NULL e empresa_id IS NULL)
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
    empresa_id,
    created_at
FROM fornecedores 
ORDER BY nome;

-- Verificar se há usuários e empresas para testar fornecedores específicos
SELECT 
    u.id as user_id,
    u.email,
    ue.empresa_id,
    e.nome as empresa_nome
FROM auth.users u
LEFT JOIN usuarios_empresas ue ON u.id = ue.usuario_id
LEFT JOIN empresas e ON ue.empresa_id = e.id
LIMIT 5; 