-- Ensure default data exists for Financeiro to work
-- This fixes 400/409 errors caused by missing Foreign Keys

-- 1. Formas de Pagamento (IDs 1 and 8 used in code)
INSERT INTO formas_pagamento (id, nome)
VALUES 
  (1, 'Pix'),
  (8, 'Cartão de Crédito')
ON CONFLICT (id) DO NOTHING;

-- 2. Categorias (IDs 1, 5, 9 used in code)
-- Check constraint on tipo: CUSTO, VENDA, COMISSAOVENDA, COMISSAOCUSTO
INSERT INTO categorias (id, nome, tipo, descricao)
VALUES 
  (1, 'Venda de Passagem', 'VENDA', 'Receita gerada pela venda de passagens'),
  (5, 'Custo de Emissão', 'CUSTO', 'Custo pago à consolidadora/companhia'),
  (9, 'Comissão de Vendas', 'COMISSAOVENDA', 'Comissão recebida sobre vendas')
ON CONFLICT (id) DO NOTHING;

-- 3. Fornecedores (ID 3 used in code for 7C)
INSERT INTO fornecedores (id, nome, tipo, email)
VALUES 
  (3, '7C TURISMO E CONSULTORIA', 'CONSOLIDADORA', 'financeiro@7cturismo.com.br')
ON CONFLICT (id) DO NOTHING;

-- 4. Reset sequences to avoid collision if manual inserts happened
SELECT setval('formas_pagamento_id_seq', (SELECT MAX(id) FROM formas_pagamento));
SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias));
SELECT setval('fornecedores_id_seq', (SELECT MAX(id) FROM fornecedores));
