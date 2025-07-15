-- Script para verificar e criar a tabela formas_pagamento
-- Execute este script no Supabase SQL Editor

-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'formas_pagamento'
);

-- Criar a tabela se não existir
CREATE TABLE IF NOT EXISTS formas_pagamento (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  user_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Verificar a estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'formas_pagamento'
ORDER BY ordinal_position;

-- Inserir algumas formas de pagamento padrão (globais)
INSERT INTO formas_pagamento (nome, user_id) VALUES
('PIX', NULL),
('Transferência Bancária', NULL),
('Boleto', NULL),
('Cartão de Crédito', NULL),
('Cartão de Débito', NULL),
('Dinheiro', NULL),
('Cheque', NULL)
ON CONFLICT DO NOTHING;

-- Verificar se há dados na tabela
SELECT * FROM formas_pagamento ORDER BY nome;

-- Habilitar RLS se não estiver habilitado
ALTER TABLE formas_pagamento ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS se não existirem
DROP POLICY IF EXISTS "Usuários podem ver formas de pagamento" ON formas_pagamento;
CREATE POLICY "Usuários podem ver formas de pagamento" ON formas_pagamento
  FOR SELECT USING (
    user_id IS NULL OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias formas de pagamento" ON formas_pagamento;
CREATE POLICY "Usuários podem inserir suas próprias formas de pagamento" ON formas_pagamento
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias formas de pagamento" ON formas_pagamento;
CREATE POLICY "Usuários podem atualizar suas próprias formas de pagamento" ON formas_pagamento
  FOR UPDATE USING (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias formas de pagamento" ON formas_pagamento;
CREATE POLICY "Usuários podem deletar suas próprias formas de pagamento" ON formas_pagamento
  FOR DELETE USING (
    user_id = auth.uid()
  ); 