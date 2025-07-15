-- 🔧 CORRIGIR TODAS AS CONSTRAINTS DA TABELA TAREFAS
-- Execute este script para corrigir todas as constraints

-- 1. Verificar todas as constraints atuais
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tarefas'::regclass;

-- 2. Remover todas as constraints de check
ALTER TABLE tarefas DROP CONSTRAINT IF EXISTS tarefas_categoria_check;
ALTER TABLE tarefas DROP CONSTRAINT IF EXISTS tarefas_prioridade_check;
ALTER TABLE tarefas DROP CONSTRAINT IF EXISTS tarefas_status_check;

-- 3. Criar novas constraints com valores corretos
ALTER TABLE tarefas ADD CONSTRAINT tarefas_categoria_check 
CHECK (categoria IN ('vendas', 'atendimento', 'administrativo', 'reuniao', 'viagem'));

ALTER TABLE tarefas ADD CONSTRAINT tarefas_prioridade_check 
CHECK (prioridade IN ('alta', 'media', 'baixa'));

ALTER TABLE tarefas ADD CONSTRAINT tarefas_status_check 
CHECK (status IN ('pendente', 'em-andamento', 'concluida', 'cancelada'));

-- 4. Verificar se as constraints foram criadas corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tarefas'::regclass;

-- 5. Testar inserção com todos os valores permitidos
DO $$
BEGIN
    BEGIN
        -- Teste com 'media' e 'viagem'
        INSERT INTO tarefas (
            titulo, descricao, prioridade, status, data_vencimento, 
            hora_vencimento, responsavel, categoria, empresa_id, 
            usuario_id, cliente, notificacoes
        ) VALUES (
            'Teste Media Viagem', 'Descrição teste', 'media', 'pendente', 
            CURRENT_DATE + INTERVAL '1 day', '10:00', 'Sistema', 
            'viagem', '8e23591e-e0af-42f8-a002-6df935bab14a', 
            '9a4f0992-e986-4ebb-82f1-9d0480cc1fb1', 'Cliente Teste', true
        );
        
        RAISE NOTICE '✅ Inserção com prioridade "media" e categoria "viagem" funcionou!';
        
        -- Remover o registro de teste
        DELETE FROM tarefas WHERE titulo = 'Teste Media Viagem';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro na inserção: %', SQLERRM;
    END;
    
    BEGIN
        -- Teste com 'baixa' e 'vendas'
        INSERT INTO tarefas (
            titulo, descricao, prioridade, status, data_vencimento, 
            hora_vencimento, responsavel, categoria, empresa_id, 
            usuario_id, cliente, notificacoes
        ) VALUES (
            'Teste Baixa Vendas', 'Descrição teste', 'baixa', 'pendente', 
            CURRENT_DATE + INTERVAL '1 day', '10:00', 'Sistema', 
            'vendas', '8e23591e-e0af-42f8-a002-6df935bab14a', 
            '9a4f0992-e986-4ebb-82f1-9d0480cc1fb1', 'Cliente Teste', true
        );
        
        RAISE NOTICE '✅ Inserção com prioridade "baixa" e categoria "vendas" funcionou!';
        
        -- Remover o registro de teste
        DELETE FROM tarefas WHERE titulo = 'Teste Baixa Vendas';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro na inserção: %', SQLERRM;
    END;
    
    BEGIN
        -- Teste com 'alta' e 'atendimento'
        INSERT INTO tarefas (
            titulo, descricao, prioridade, status, data_vencimento, 
            hora_vencimento, responsavel, categoria, empresa_id, 
            usuario_id, cliente, notificacoes
        ) VALUES (
            'Teste Alta Atendimento', 'Descrição teste', 'alta', 'pendente', 
            CURRENT_DATE + INTERVAL '1 day', '10:00', 'Sistema', 
            'atendimento', '8e23591e-e0af-42f8-a002-6df935bab14a', 
            '9a4f0992-e986-4ebb-82f1-9d0480cc1fb1', 'Cliente Teste', true
        );
        
        RAISE NOTICE '✅ Inserção com prioridade "alta" e categoria "atendimento" funcionou!';
        
        -- Remover o registro de teste
        DELETE FROM tarefas WHERE titulo = 'Teste Alta Atendimento';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro na inserção: %', SQLERRM;
    END;
END $$;

-- 6. Verificar estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tarefas' 
ORDER BY ordinal_position;

-- 7. Verificar se há dados na tabela
SELECT COUNT(*) as total_tarefas FROM tarefas; 