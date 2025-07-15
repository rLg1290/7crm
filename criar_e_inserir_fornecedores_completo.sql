-- Script completo para criar tabela fornecedores e inserir dados de teste
-- Execute este script no Supabase SQL Editor

-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'fornecedores'
);

-- Criar a tabela se não existir com todas as colunas necessárias
CREATE TABLE IF NOT EXISTS fornecedores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  cnpj VARCHAR(18),
  email VARCHAR(100),
  telefone VARCHAR(20),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  observacoes TEXT,
  user_id UUID,
  empresa_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position;

-- Inserir fornecedores globais de teste (user_id IS NULL)
INSERT INTO fornecedores (nome, cnpj, email, telefone, cidade, estado, endereco, cep, observacoes, user_id)
VALUES 
    ('Fornecedor Global 1', '12.345.678/0001-90', 'contato@global1.com', '(11) 99999-1111', 'São Paulo', 'SP', 'Rua das Flores, 123', '01234-567', 'Fornecedor global de teste', NULL),
    ('Fornecedor Global 2', '98.765.432/0001-10', 'contato@global2.com', '(11) 99999-2222', 'Rio de Janeiro', 'RJ', 'Av. Copacabana, 456', '22070-001', 'Fornecedor global de teste', NULL),
    ('Fornecedor Global 3', '11.222.333/0001-44', 'contato@global3.com', '(11) 99999-3333', 'Belo Horizonte', 'MG', 'Rua da Liberdade, 789', '30112-000', 'Fornecedor global de teste', NULL)
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

-- Habilitar RLS se não estiver habilitado
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS se não existirem
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