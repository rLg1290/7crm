-- Script para atualizar a tabela fornecedores para usar empresa_id
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT 'Tabela fornecedores existe:' as status, 
       EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public'
         AND table_name = 'fornecedores'
       ) as existe;

-- 2. Se a tabela não existe, criar com a estrutura correta
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
            empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Habilitar RLS
        ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas RLS baseadas na lógica de empresa_id
        CREATE POLICY "Usuários podem ver fornecedores globais e da sua empresa" ON fornecedores
            FOR SELECT USING (
                empresa_id IS NULL OR 
                empresa_id IN (
                    SELECT empresa_id FROM usuarios_empresas 
                    WHERE usuario_id = auth.uid()
                )
            );
            
        CREATE POLICY "Usuários podem inserir fornecedores para sua empresa" ON fornecedores
            FOR INSERT WITH CHECK (
                empresa_id IN (
                    SELECT empresa_id FROM usuarios_empresas 
                    WHERE usuario_id = auth.uid()
                )
            );
            
        CREATE POLICY "Usuários podem atualizar fornecedores da sua empresa" ON fornecedores
            FOR UPDATE USING (
                empresa_id IN (
                    SELECT empresa_id FROM usuarios_empresas 
                    WHERE usuario_id = auth.uid()
                )
            );
            
        CREATE POLICY "Usuários podem deletar fornecedores da sua empresa" ON fornecedores
            FOR DELETE USING (
                empresa_id IN (
                    SELECT empresa_id FROM usuarios_empresas 
                    WHERE usuario_id = auth.uid()
                )
            );
            
        RAISE NOTICE 'Tabela fornecedores criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela fornecedores já existe.';
    END IF;
END $$;

-- 3. Se a tabela existe mas não tem empresa_id, adicionar a coluna
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'fornecedores' 
        AND column_name = 'empresa_id'
    ) THEN
        ALTER TABLE fornecedores ADD COLUMN empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
        RAISE NOTICE 'Coluna empresa_id adicionada à tabela fornecedores.';
    ELSE
        RAISE NOTICE 'Coluna empresa_id já existe na tabela fornecedores.';
    END IF;
END $$;

-- 4. Remover colunas que não existem mais (se existirem)
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
    
    -- Remover coluna cep se existir
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'fornecedores' 
        AND column_name = 'cep'
    ) THEN
        ALTER TABLE fornecedores DROP COLUMN cep;
        RAISE NOTICE 'Coluna cep removida da tabela fornecedores.';
    END IF;
END $$;

-- 5. Migrar dados existentes (se houver)
DO $$
DECLARE
    fornecedor_count INTEGER;
    empresa_exemplo_id UUID;
BEGIN
    SELECT COUNT(*) INTO fornecedor_count FROM fornecedores;
    
    -- Se há fornecedores com user_id mas sem empresa_id, migrar
    IF fornecedor_count > 0 THEN
        -- Pegar uma empresa de exemplo para migrar fornecedores antigos
        SELECT id INTO empresa_exemplo_id FROM empresas LIMIT 1;
        
        -- Migrar fornecedores que têm user_id mas não têm empresa_id
        IF empresa_exemplo_id IS NOT NULL THEN
            UPDATE fornecedores 
            SET empresa_id = empresa_exemplo_id 
            WHERE user_id IS NOT NULL AND empresa_id IS NULL;
            
            RAISE NOTICE 'Fornecedores migrados para empresa_id: %', empresa_exemplo_id;
        END IF;
    END IF;
END $$;

-- 6. Verificar se há dados na tabela
SELECT COUNT(*) as total_fornecedores FROM fornecedores;

-- 7. Se não há dados, inserir fornecedores de exemplo
DO $$
DECLARE
    fornecedor_count INTEGER;
    empresa_exemplo_id UUID;
BEGIN
    SELECT COUNT(*) INTO fornecedor_count FROM fornecedores;
    
    -- Pegar uma empresa de exemplo para inserir fornecedores específicos
    SELECT id INTO empresa_exemplo_id FROM empresas LIMIT 1;
    
    IF fornecedor_count = 0 THEN
        -- Inserir fornecedores globais (empresa_id = NULL)
        INSERT INTO fornecedores (nome, cnpj, email, telefone, empresa_id) VALUES
        ('CVC Viagens', '12.345.678/0001-90', 'contato@cvc.com.br', '(11) 3003-3003', NULL),
        ('Decolar.com', '98.765.432/0001-10', 'atendimento@decolar.com', '(11) 3003-4000', NULL),
        ('123 Milhas', '11.222.333/0001-44', 'suporte@123milhas.com', '(11) 3003-5000', NULL),
        ('Hoteis.com', '55.666.777/0001-88', 'reservas@hoteis.com', '(11) 3003-6000', NULL),
        ('Booking.com', '99.888.777/0001-66', 'ajuda@booking.com', '(11) 3003-7000', NULL);
        
        -- Se existe uma empresa, inserir fornecedores específicos dela
        IF empresa_exemplo_id IS NOT NULL THEN
            INSERT INTO fornecedores (nome, cnpj, email, telefone, empresa_id) VALUES
            ('Fornecedor Local A', '11.111.111/0001-11', 'contato@fornecedora.com', '(11) 3003-8000', empresa_exemplo_id),
            ('Fornecedor Local B', '22.222.222/0001-22', 'contato@fornecedorb.com', '(11) 3003-9000', empresa_exemplo_id);
        END IF;
        
        RAISE NOTICE 'Fornecedores de exemplo inseridos com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela já possui % fornecedores.', fornecedor_count;
    END IF;
END $$;

-- 8. Verificar resultado final
SELECT 
    id,
    nome,
    cnpj,
    email,
    telefone,
    CASE 
        WHEN empresa_id IS NULL THEN 'Global'
        ELSE 'Empresa Específica'
    END as tipo,
    empresa_id,
    created_at
FROM fornecedores 
ORDER BY nome; 