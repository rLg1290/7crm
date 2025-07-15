-- Script para verificar e criar a tabela contas_pagar
-- Execute este script no Supabase SQL Editor

-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'contas_pagar'
);

-- Criar a tabela se não existir
CREATE TABLE IF NOT EXISTS contas_pagar (
  id SERIAL PRIMARY KEY,
  categoria VARCHAR(100) NOT NULL,
  fornecedor_id INTEGER,
  forma_pagamento VARCHAR(100) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  parcelas VARCHAR(10) NOT NULL,
  vencimento DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDENTE',
  observacoes TEXT,
  origem VARCHAR(50) DEFAULT 'MANUAL',
  origem_id VARCHAR(255),
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL
);

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contas_pagar'
ORDER BY ordinal_position;

-- Habilitar RLS se não estiver habilitado
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS se não existirem
DROP POLICY IF EXISTS "Usuários podem ver suas próprias contas a pagar" ON contas_pagar;
CREATE POLICY "Usuários podem ver suas próprias contas a pagar" ON contas_pagar
  FOR SELECT USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias contas a pagar" ON contas_pagar;
CREATE POLICY "Usuários podem inserir suas próprias contas a pagar" ON contas_pagar
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias contas a pagar" ON contas_pagar;
CREATE POLICY "Usuários podem atualizar suas próprias contas a pagar" ON contas_pagar
  FOR UPDATE USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias contas a pagar" ON contas_pagar;
CREATE POLICY "Usuários podem deletar suas próprias contas a pagar" ON contas_pagar
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- Verificar se há dados na tabela
SELECT * FROM contas_pagar ORDER BY created_at DESC LIMIT 10;

-- Teste de inserção (opcional - remova após testar)
-- INSERT INTO contas_pagar (categoria, forma_pagamento, parcelas, vencimento, status, observacoes, origem, user_id) 
-- VALUES ('Teste', 'PIX', '1', '2024-12-31', 'PENDENTE', 'Conta de teste', 'MANUAL', '00000000-0000-0000-0000-000000000000')
-- ON CONFLICT DO NOTHING; 