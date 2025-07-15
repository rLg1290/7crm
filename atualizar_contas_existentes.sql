-- Script para atualizar contas existentes sem forma_pagamento
-- Execute este script após verificar_e_corrigir_contas_pagar.sql

-- Verificar contas sem forma_pagamento
SELECT COUNT(*) as contas_sem_forma_pagamento
FROM contas_pagar 
WHERE forma_pagamento IS NULL OR forma_pagamento = '';

-- Verificar formas de pagamento disponíveis
SELECT id, nome FROM formas_pagamento ORDER BY nome;

-- Atualizar contas existentes sem forma_pagamento
-- Definir como 'PIX' por padrão (você pode alterar conforme necessário)
UPDATE contas_pagar 
SET forma_pagamento = 'PIX' 
WHERE forma_pagamento IS NULL OR forma_pagamento = '';

-- Verificar se a atualização foi bem-sucedida
SELECT COUNT(*) as contas_atualizadas
FROM contas_pagar 
WHERE forma_pagamento = 'PIX';

-- Mostrar algumas contas atualizadas
SELECT id, categoria, forma_pagamento, valor, vencimento, status 
FROM contas_pagar 
WHERE forma_pagamento = 'PIX'
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar se ainda há contas sem forma_pagamento
SELECT COUNT(*) as contas_ainda_sem_forma
FROM contas_pagar 
WHERE forma_pagamento IS NULL OR forma_pagamento = '';

-- Mostrar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contas_pagar'
ORDER BY ordinal_position; 