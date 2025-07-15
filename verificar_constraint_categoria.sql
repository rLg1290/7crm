-- 🔍 VERIFICAR CONSTRAINT DE CATEGORIA
-- Execute este script para verificar quais valores são permitidos

-- 1. Verificar a constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tarefas'::regclass 
AND conname LIKE '%categoria%';

-- 2. Verificar os valores permitidos na constraint
SELECT 
    conname,
    pg_get_constraintdef(oid)
FROM pg_constraint 
WHERE conrelid = 'tarefas'::regclass 
AND contype = 'c';

-- 3. Tentar inserir com diferentes valores para testar
-- (Comente estas linhas se não quiser inserir dados de teste)

-- Teste 1: 'viagem' (deve funcionar)
-- INSERT INTO tarefas (
--   titulo, descricao, prioridade, status, data_vencimento, 
--   hora_vencimento, responsavel, categoria, empresa_id, 
--   usuario_id, cliente, notificacoes
-- ) VALUES (
--   'Teste Viagem', 'Descrição teste', 'media', 'pendente', 
--   CURRENT_DATE + INTERVAL '1 day', '10:00', 'Sistema', 
--   'viagem', '8e23591e-e0af-42f8-a002-6df935bab14a', 
--   '9a4f0992-e986-4ebb-82f1-9d0480cc1fb1', 'Cliente Teste', true
-- );

-- Teste 2: 'vendas' (deve funcionar)
-- INSERT INTO tarefas (
--   titulo, descricao, prioridade, status, data_vencimento, 
--   hora_vencimento, responsavel, categoria, empresa_id, 
--   usuario_id, cliente, notificacoes
-- ) VALUES (
--   'Teste Vendas', 'Descrição teste', 'media', 'pendente', 
--   CURRENT_DATE + INTERVAL '1 day', '10:00', 'Sistema', 
--   'vendas', '8e23591e-e0af-42f8-a002-6df935bab14a', 
--   '9a4f0992-e986-4ebb-82f1-9d0480cc1fb1', 'Cliente Teste', true
-- );

-- 4. Verificar estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tarefas' 
AND column_name = 'categoria';

-- 5. Verificar se há dados na tabela
SELECT COUNT(*) as total_tarefas FROM tarefas;

-- 6. Verificar valores únicos de categoria existentes
SELECT DISTINCT categoria FROM tarefas WHERE categoria IS NOT NULL; 