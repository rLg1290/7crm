-- Script para verificar e corrigir a estrutura da tabela fornecedores
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT 'Tabela fornecedores existe:' as status, 
       EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public'
         AND table_name = 'fornecedores'
       ) as existe;

-- 2. Verificar estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position;

-- 3. Adicionar colunas que podem estar faltando
DO $$
BEGIN
    -- Adicionar coluna cidade se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fornecedores' AND column_name = 'cidade'
    ) THEN
        ALTER TABLE fornecedores ADD COLUMN cidade VARCHAR(100);
        RAISE NOTICE 'Coluna cidade adicionada';
    END IF;

    -- Adicionar coluna estado se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fornecedores' AND column_name = 'estado'
    ) THEN
        ALTER TABLE fornecedores ADD COLUMN estado VARCHAR(2);
        RAISE NOTICE 'Coluna estado adicionada';
    END IF;

    -- Adicionar coluna endereco se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fornecedores' AND column_name = 'endereco'
    ) THEN
        ALTER TABLE fornecedores ADD COLUMN endereco TEXT;
        RAISE NOTICE 'Coluna endereco adicionada';
    END IF;

    -- Adicionar coluna cep se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fornecedores' AND column_name = 'cep'
    ) THEN
        ALTER TABLE fornecedores ADD COLUMN cep VARCHAR(10);
        RAISE NOTICE 'Coluna cep adicionada';
    END IF;

    -- Adicionar coluna observacoes se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fornecedores' AND column_name = 'observacoes'
    ) THEN
        ALTER TABLE fornecedores ADD COLUMN observacoes TEXT;
        RAISE NOTICE 'Coluna observacoes adicionada';
    END IF;

    -- Adicionar coluna empresa_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fornecedores' AND column_name = 'empresa_id'
    ) THEN
        ALTER TABLE fornecedores ADD COLUMN empresa_id UUID;
        RAISE NOTICE 'Coluna empresa_id adicionada';
    END IF;

    -- Adicionar coluna updated_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fornecedores' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE fornecedores ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Coluna updated_at adicionada';
    END IF;
END $$;

-- 4. Verificar estrutura após correções
SELECT 'Estrutura após correções:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position;

-- 5. Inserir dados de teste se a tabela estiver vazia
INSERT INTO fornecedores (nome, cnpj, email, telefone, cidade, estado, endereco, cep, observacoes, user_id)
SELECT 
    'Fornecedor Global 1', '12.345.678/0001-90', 'contato@global1.com', '(11) 99999-1111', 
    'São Paulo', 'SP', 'Rua das Flores, 123', '01234-567', 'Fornecedor global de teste', NULL
WHERE NOT EXISTS (SELECT 1 FROM fornecedores WHERE nome = 'Fornecedor Global 1');

INSERT INTO fornecedores (nome, cnpj, email, telefone, cidade, estado, endereco, cep, observacoes, user_id)
SELECT 
    'Fornecedor Global 2', '98.765.432/0001-10', 'contato@global2.com', '(11) 99999-2222', 
    'Rio de Janeiro', 'RJ', 'Av. Copacabana, 456', '22070-001', 'Fornecedor global de teste', NULL
WHERE NOT EXISTS (SELECT 1 FROM fornecedores WHERE nome = 'Fornecedor Global 2');

INSERT INTO fornecedores (nome, cnpj, email, telefone, cidade, estado, endereco, cep, observacoes, user_id)
SELECT 
    'Fornecedor Global 3', '11.222.333/0001-44', 'contato@global3.com', '(11) 99999-3333', 
    'Belo Horizonte', 'MG', 'Rua da Liberdade, 789', '30112-000', 'Fornecedor global de teste', NULL
WHERE NOT EXISTS (SELECT 1 FROM fornecedores WHERE nome = 'Fornecedor Global 3');

-- 6. Verificar dados inseridos
SELECT 'Dados na tabela:' as info;
SELECT id, nome, cnpj, email, telefone, cidade, estado, user_id, created_at
FROM fornecedores 
ORDER BY nome;

-- 7. Habilitar RLS se não estiver habilitado
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS
DROP POLICY IF EXISTS "Usuários podem ver fornecedores" ON fornecedores;
CREATE POLICY "Usuários podem ver fornecedores" ON fornecedores
  FOR SELECT USING (
    user_id IS NULL OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Usuários podem inserir seus próprios fornecedores" ON fornecedores;
CREATE POLICY "Usuários podem inserir seus próprios fornecedores" ON fornecedores
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios fornecedores" ON fornecedores;
CREATE POLICY "Usuários podem atualizar seus próprios fornecedores" ON fornecedores
  FOR UPDATE USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Usuários podem deletar seus próprios fornecedores" ON fornecedores;
CREATE POLICY "Usuários podem deletar seus próprios fornecedores" ON fornecedores
  FOR DELETE USING (
    user_id = auth.uid()
  );

SELECT 'Script executado com sucesso!' as resultado; 