-- Script simples para corrigir a tabela fornecedores
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT 'Tabela fornecedores existe:' as status, 
       EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public'
         AND table_name = 'fornecedores'
       ) as existe;

-- 2. Se a tabela não existe, criar com estrutura simples
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fornecedores') THEN
        CREATE TABLE fornecedores (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            cnpj VARCHAR(18),
            email VARCHAR(255),
            telefone VARCHAR(20),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Habilitar RLS
        ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas RLS simples
        CREATE POLICY "Usuários podem ver fornecedores globais e próprios" ON fornecedores
            FOR SELECT USING (
                user_id IS NULL OR 
                user_id = auth.uid()
            );
            
        CREATE POLICY "Usuários podem inserir fornecedores próprios" ON fornecedores
            FOR INSERT WITH CHECK (
                user_id = auth.uid()
            );
            
        CREATE POLICY "Usuários podem atualizar fornecedores próprios" ON fornecedores
            FOR UPDATE USING (
                user_id = auth.uid()
            );
            
        CREATE POLICY "Usuários podem deletar fornecedores próprios" ON fornecedores
            FOR DELETE USING (
                user_id = auth.uid()
            );
            
        RAISE NOTICE 'Tabela fornecedores criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela fornecedores já existe.';
    END IF;
END $$;

-- 3. Se a tabela existe, remover colunas problemáticas
DO $$
BEGIN
    -- Remover coluna endereco se existir
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'fornecedores' 
        AND column_name = 'endereco'
    ) THEN
        ALTER TABLE fornecedores DROP COLUMN endereco;
        RAISE NOTICE 'Coluna endereco removida da tabela fornecedores.';
    END IF;
    
    -- Remover coluna observacoes se existir
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'fornecedores' 
        AND column_name = 'observacoes'
    ) THEN
        ALTER TABLE fornecedores DROP COLUMN observacoes;
        RAISE NOTICE 'Coluna observacoes removida da tabela fornecedores.';
    END IF;
    
    -- Remover coluna cidade se existir
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'fornecedores' 
        AND column_name = 'cidade'
    ) THEN
        ALTER TABLE fornecedores DROP COLUMN cidade;
        RAISE NOTICE 'Coluna cidade removida da tabela fornecedores.';
    END IF;
    
    -- Remover coluna estado se existir
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'fornecedores' 
        AND column_name = 'estado'
    ) THEN
        ALTER TABLE fornecedores DROP COLUMN estado;
        RAISE NOTICE 'Coluna estado removida da tabela fornecedores.';
    END IF;
END $$;

-- 4. Verificar se há dados na tabela
SELECT COUNT(*) as total_fornecedores FROM fornecedores;

-- 5. Se não há dados, inserir fornecedores de exemplo
DO $$
DECLARE
    fornecedor_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fornecedor_count FROM fornecedores;
    
    IF fornecedor_count = 0 THEN
        -- Inserir fornecedores globais (user_id = NULL)
        INSERT INTO fornecedores (nome, cnpj, email, telefone, user_id) VALUES
        ('CVC Viagens', '12.345.678/0001-90', 'contato@cvc.com.br', '(11) 3003-3003', NULL),
        ('Decolar.com', '98.765.432/0001-10', 'atendimento@decolar.com', '(11) 3003-4000', NULL),
        ('123 Milhas', '11.222.333/0001-44', 'suporte@123milhas.com', '(11) 3003-5000', NULL),
        ('Hoteis.com', '55.666.777/0001-88', 'reservas@hoteis.com', '(11) 3003-6000', NULL),
        ('Booking.com', '99.888.777/0001-66', 'ajuda@booking.com', '(11) 3003-7000', NULL);
        
        RAISE NOTICE 'Fornecedores de exemplo inseridos com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela já possui % fornecedores.', fornecedor_count;
    END IF;
END $$;

-- 6. Verificar resultado final
SELECT 
    id,
    nome,
    cnpj,
    email,
    telefone,
    CASE 
        WHEN user_id IS NULL THEN 'Global'
        ELSE 'Próprio'
    END as tipo,
    created_at
FROM fornecedores 
ORDER BY nome; 