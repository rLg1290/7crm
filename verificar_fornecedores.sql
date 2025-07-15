-- Script para verificar e criar a tabela fornecedores
-- Execute este script no Supabase SQL Editor

-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'fornecedores'
);

-- Criar a tabela se não existir
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position;

-- Inserir alguns fornecedores de exemplo
INSERT INTO fornecedores (nome, cnpj, email, telefone, cidade, estado, user_id) VALUES
('Fornecedor Exemplo 1', '12.345.678/0001-90', 'contato@fornecedor1.com', '(11) 99999-9999', 'São Paulo', 'SP', NULL),
('Fornecedor Exemplo 2', '98.765.432/0001-10', 'contato@fornecedor2.com', '(11) 88888-8888', 'Rio de Janeiro', 'RJ', NULL),
('Fornecedor Exemplo 3', '11.222.333/0001-44', 'contato@fornecedor3.com', '(11) 77777-7777', 'Belo Horizonte', 'MG', NULL)
ON CONFLICT DO NOTHING;

-- Verificar se há dados na tabela
SELECT * FROM fornecedores ORDER BY nome;

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