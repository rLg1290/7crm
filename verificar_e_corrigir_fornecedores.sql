-- Script para verificar e corrigir a tabela fornecedores
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela fornecedores existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fornecedores') THEN
        RAISE NOTICE 'Tabela fornecedores não existe. Criando...';
        
        -- Criar a tabela fornecedores
        CREATE TABLE fornecedores (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            cnpj VARCHAR(18),
            email VARCHAR(255),
            telefone VARCHAR(20),
            endereco TEXT,
            observacoes TEXT,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Criar índices para melhor performance
        CREATE INDEX idx_fornecedores_user_id ON fornecedores(user_id);
        CREATE INDEX idx_fornecedores_nome ON fornecedores(nome);
        CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj);
        
        -- Habilitar RLS (Row Level Security)
        ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas RLS
        -- Política para permitir acesso a fornecedores globais (user_id IS NULL)
        CREATE POLICY "Fornecedores globais são visíveis para todos" ON fornecedores
            FOR SELECT USING (user_id IS NULL);
        
        -- Política para permitir acesso aos próprios fornecedores
        CREATE POLICY "Usuários podem ver seus próprios fornecedores" ON fornecedores
            FOR SELECT USING (auth.uid() = user_id);
        
        -- Política para inserção
        CREATE POLICY "Usuários podem inserir seus próprios fornecedores" ON fornecedores
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        -- Política para atualização
        CREATE POLICY "Usuários podem atualizar seus próprios fornecedores" ON fornecedores
            FOR UPDATE USING (auth.uid() = user_id);
        
        -- Política para exclusão
        CREATE POLICY "Usuários podem excluir seus próprios fornecedores" ON fornecedores
            FOR DELETE USING (auth.uid() = user_id);
        
        RAISE NOTICE 'Tabela fornecedores criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela fornecedores já existe.';
    END IF;
END $$;

-- 2. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position;

-- 3. Verificar se há fornecedores na tabela
SELECT 
    COUNT(*) as total_fornecedores,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as fornecedores_globais,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as fornecedores_usuarios
FROM fornecedores;

-- 4. Se não há fornecedores globais, inserir alguns de exemplo
INSERT INTO fornecedores (nome, cnpj, email, telefone, user_id)
SELECT * FROM (VALUES
    ('CVC Viagens', '12.345.678/0001-90', 'contato@cvc.com.br', '(11) 3003-3003', NULL),
    ('Decolar.com', '98.765.432/0001-10', 'atendimento@decolar.com', '(11) 4004-4004', NULL),
    ('Hoteis.com', '11.222.333/0001-44', 'suporte@hoteis.com', '(11) 5005-5005', NULL),
    ('Booking.com', '55.666.777/0001-88', 'help@booking.com', '(11) 6006-6006', NULL),
    ('Expedia', '99.000.111/0001-22', 'support@expedia.com', '(11) 7007-7007', NULL),
    ('Latam Airlines', '33.444.555/0001-66', 'reservas@latam.com', '(11) 8008-8008', NULL),
    ('Gol Linhas Aéreas', '77.888.999/0001-33', 'atendimento@gol.com', '(11) 9009-9009', NULL),
    ('Azul Linhas Aéreas', '22.333.444/0001-55', 'contato@azul.com', '(11) 1010-1010', NULL)
) AS v(nome, cnpj, email, telefone, user_id)
WHERE NOT EXISTS (
    SELECT 1 FROM fornecedores 
    WHERE fornecedores.nome = v.nome AND fornecedores.user_id IS NULL
);

-- 5. Verificar resultado final
SELECT 
    'Fornecedores após correção:' as status,
    COUNT(*) as total_fornecedores,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as fornecedores_globais,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) as fornecedores_usuarios
FROM fornecedores;

-- 6. Mostrar alguns fornecedores de exemplo
SELECT 
    id,
    nome,
    cnpj,
    email,
    telefone,
    CASE 
        WHEN user_id IS NULL THEN 'Global'
        ELSE 'Usuário específico'
    END as tipo
FROM fornecedores 
ORDER BY user_id NULLS FIRST, nome
LIMIT 10; 