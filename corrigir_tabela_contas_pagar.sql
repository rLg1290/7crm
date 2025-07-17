-- Script para corrigir problemas na tabela contas_pagar
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'contas_pagar'
) as tabela_existe;

-- 2. Se a tabela não existir, criar com a estrutura correta
CREATE TABLE IF NOT EXISTS contas_pagar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categoria_id INTEGER NOT NULL,
    fornecedor_id INTEGER,
    forma_pagamento_id INTEGER,
    valor DECIMAL(10,2) NOT NULL,
    parcelas VARCHAR(10) NOT NULL,
    vencimento DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    observacoes TEXT,
    origem VARCHAR(50) DEFAULT 'MANUAL',
    origem_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Adicionar constraint para valores válidos de status
ALTER TABLE contas_pagar 
DROP CONSTRAINT IF EXISTS contas_pagar_status_check;

ALTER TABLE contas_pagar 
ADD CONSTRAINT contas_pagar_status_check 
CHECK (status IN ('PENDENTE', 'PAGA', 'VENCIDA'));

-- 4. Atualizar contas com status nulo ou inválido
UPDATE contas_pagar 
SET status = 'PENDENTE' 
WHERE status IS NULL OR status NOT IN ('PENDENTE', 'PAGA', 'VENCIDA');

-- 5. Verificar se há contas com status nulo
SELECT COUNT(*) as contas_sem_status
FROM contas_pagar 
WHERE status IS NULL;

-- 6. Verificar os valores únicos de status após a correção
SELECT DISTINCT status, COUNT(*) as quantidade
FROM contas_pagar 
GROUP BY status 
ORDER BY status;

-- 7. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_contas_pagar_user_id ON contas_pagar(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON contas_pagar(vencimento);

-- 8. Habilitar RLS (Row Level Security)
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;

-- 9. Criar política RLS para usuários verem apenas suas contas
DROP POLICY IF EXISTS "Usuários podem ver suas próprias contas a pagar" ON contas_pagar;

CREATE POLICY "Usuários podem ver suas próprias contas a pagar"
ON contas_pagar
FOR ALL
USING (auth.uid() = user_id);

-- 10. Verificar a estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contas_pagar' 
ORDER BY ordinal_position; 