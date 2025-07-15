-- Script para inserir fornecedores de teste com diferentes origens
-- Execute este script no Supabase SQL Editor após adicionar o campo empresa_id

-- Primeiro, verificar se o campo empresa_id existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fornecedores' 
AND column_name = 'empresa_id';

-- Inserir fornecedores globais (user_id IS NULL, empresa_id IS NULL)
INSERT INTO fornecedores (nome, cnpj, email, telefone, cidade, estado, endereco, cep, observacoes, user_id, empresa_id)
VALUES 
    ('Fornecedor Global 1', '12.345.678/0001-90', 'contato@global1.com', '(11) 99999-1111', 'São Paulo', 'SP', 'Rua das Flores, 123', '01234-567', 'Fornecedor global de teste', NULL, NULL),
    ('Fornecedor Global 2', '98.765.432/0001-10', 'contato@global2.com', '(11) 99999-2222', 'Rio de Janeiro', 'RJ', 'Av. Copacabana, 456', '22070-001', 'Fornecedor global de teste', NULL, NULL),
    ('Fornecedor Global 3', '11.222.333/0001-44', 'contato@global3.com', '(11) 99999-3333', 'Belo Horizonte', 'MG', 'Rua da Liberdade, 789', '30112-000', 'Fornecedor global de teste', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Inserir fornecedores de exemplo para empresa (substitua o UUID pela empresa_id real)
-- Para testar, vamos usar um UUID de exemplo
INSERT INTO fornecedores (nome, cnpj, email, telefone, cidade, estado, endereco, cep, observacoes, user_id, empresa_id)
VALUES 
    ('Fornecedor Empresa 1', '22.333.444/0001-55', 'contato@empresa1.com', '(11) 88888-1111', 'São Paulo', 'SP', 'Av. Paulista, 1000', '01310-100', 'Fornecedor da empresa', NULL, '00000000-0000-0000-0000-000000000001'),
    ('Fornecedor Empresa 2', '33.444.555/0001-66', 'contato@empresa2.com', '(11) 88888-2222', 'São Paulo', 'SP', 'Rua Augusta, 500', '01412-000', 'Fornecedor da empresa', NULL, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Verificar fornecedores inseridos
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
    CASE 
        WHEN user_id IS NOT NULL THEN '👤 Usuário'
        WHEN empresa_id IS NOT NULL THEN '🏢 Empresa'
        ELSE '🌐 Global'
    END as origem,
    created_at
FROM fornecedores 
ORDER BY nome;

-- Mostrar resumo por origem
SELECT 
    CASE 
        WHEN user_id IS NOT NULL THEN '👤 Usuário'
        WHEN empresa_id IS NOT NULL THEN '🏢 Empresa'
        ELSE '🌐 Global'
    END as origem,
    COUNT(*) as quantidade
FROM fornecedores 
GROUP BY origem
ORDER BY origem; 