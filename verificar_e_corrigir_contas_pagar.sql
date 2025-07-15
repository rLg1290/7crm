-- Script para verificar e corrigir a estrutura da tabela contas_pagar
-- Execute este script no Supabase SQL Editor

-- Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'contas_pagar'
);

-- Verificar a estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contas_pagar'
ORDER BY ordinal_position;

-- Verificar se o campo forma_pagamento existe
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_name = 'contas_pagar'
   AND column_name = 'forma_pagamento'
);

-- Adicionar campo forma_pagamento se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_pagar'
        AND column_name = 'forma_pagamento'
    ) THEN
        ALTER TABLE contas_pagar ADD COLUMN forma_pagamento VARCHAR(100);
        RAISE NOTICE 'Campo forma_pagamento adicionado à tabela contas_pagar';
    ELSE
        RAISE NOTICE 'Campo forma_pagamento já existe na tabela contas_pagar';
    END IF;
END $$;

-- Verificar se o campo user_id existe
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_name = 'contas_pagar'
   AND column_name = 'user_id'
);

-- Adicionar campo user_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_pagar'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE contas_pagar ADD COLUMN user_id UUID;
        RAISE NOTICE 'Campo user_id adicionado à tabela contas_pagar';
    ELSE
        RAISE NOTICE 'Campo user_id já existe na tabela contas_pagar';
    END IF;
END $$;

-- Verificar se o campo fornecedor_id existe
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_name = 'contas_pagar'
   AND column_name = 'fornecedor_id'
);

-- Adicionar campo fornecedor_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_pagar'
        AND column_name = 'fornecedor_id'
    ) THEN
        ALTER TABLE contas_pagar ADD COLUMN fornecedor_id INTEGER;
        RAISE NOTICE 'Campo fornecedor_id adicionado à tabela contas_pagar';
    ELSE
        RAISE NOTICE 'Campo fornecedor_id já existe na tabela contas_pagar';
    END IF;
END $$;

-- Verificar se o campo parcelas existe
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_name = 'contas_pagar'
   AND column_name = 'parcelas'
);

-- Adicionar campo parcelas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_pagar'
        AND column_name = 'parcelas'
    ) THEN
        ALTER TABLE contas_pagar ADD COLUMN parcelas VARCHAR(10) DEFAULT '1';
        RAISE NOTICE 'Campo parcelas adicionado à tabela contas_pagar';
    ELSE
        RAISE NOTICE 'Campo parcelas já existe na tabela contas_pagar';
    END IF;
END $$;

-- Verificar se o campo origem existe
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_name = 'contas_pagar'
   AND column_name = 'origem'
);

-- Adicionar campo origem se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_pagar'
        AND column_name = 'origem'
    ) THEN
        ALTER TABLE contas_pagar ADD COLUMN origem VARCHAR(50) DEFAULT 'MANUAL';
        RAISE NOTICE 'Campo origem adicionado à tabela contas_pagar';
    ELSE
        RAISE NOTICE 'Campo origem já existe na tabela contas_pagar';
    END IF;
END $$;

-- Verificar se o campo origem_id existe
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_name = 'contas_pagar'
   AND column_name = 'origem_id'
);

-- Adicionar campo origem_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_pagar'
        AND column_name = 'origem_id'
    ) THEN
        ALTER TABLE contas_pagar ADD COLUMN origem_id VARCHAR(255);
        RAISE NOTICE 'Campo origem_id adicionado à tabela contas_pagar';
    ELSE
        RAISE NOTICE 'Campo origem_id já existe na tabela contas_pagar';
    END IF;
END $$;

-- Verificar se o campo pago_em existe
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_name = 'contas_pagar'
   AND column_name = 'pago_em'
);

-- Adicionar campo pago_em se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_pagar'
        AND column_name = 'pago_em'
    ) THEN
        ALTER TABLE contas_pagar ADD COLUMN pago_em DATE;
        RAISE NOTICE 'Campo pago_em adicionado à tabela contas_pagar';
    ELSE
        RAISE NOTICE 'Campo pago_em já existe na tabela contas_pagar';
    END IF;
END $$;

-- Verificar a estrutura final da tabela
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
SELECT COUNT(*) as total_contas FROM contas_pagar;

-- Mostrar algumas contas de exemplo
SELECT id, categoria, forma_pagamento, valor, vencimento, status, user_id 
FROM contas_pagar 
ORDER BY created_at DESC 
LIMIT 5; 