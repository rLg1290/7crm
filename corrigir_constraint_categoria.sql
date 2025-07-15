-- 🔧 CORRIGIR CONSTRAINT DE CATEGORIA
-- Execute este script se a constraint estiver incorreta

-- 1. Verificar constraint atual
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tarefas'::regclass 
AND conname LIKE '%categoria%';

-- 2. Remover constraint antiga se existir
ALTER TABLE tarefas DROP CONSTRAINT IF EXISTS tarefas_categoria_check;

-- 3. Criar nova constraint com valores corretos
ALTER TABLE tarefas ADD CONSTRAINT tarefas_categoria_check 
CHECK (categoria IN ('vendas', 'atendimento', 'administrativo', 'reuniao', 'viagem'));

-- 4. Verificar se a constraint foi criada corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tarefas'::regclass 
AND conname = 'tarefas_categoria_check';

-- 5. Testar inserção com 'viagem'
DO $$
BEGIN
    BEGIN
        INSERT INTO tarefas (
            titulo, descricao, prioridade, status, data_vencimento, 
            hora_vencimento, responsavel, categoria, empresa_id, 
            usuario_id, cliente, notificacoes
        ) VALUES (
            'Teste Viagem', 'Descrição teste', 'media', 'pendente', 
            CURRENT_DATE + INTERVAL '1 day', '10:00', 'Sistema', 
            'viagem', '8e23591e-e0af-42f8-a002-6df935bab14a', 
            '9a4f0992-e986-4ebb-82f1-9d0480cc1fb1', 'Cliente Teste', true
        );
        
        RAISE NOTICE '✅ Inserção com categoria "viagem" funcionou!';
        
        -- Remover o registro de teste
        DELETE FROM tarefas WHERE titulo = 'Teste Viagem';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro na inserção: %', SQLERRM;
    END;
END $$;

-- 6. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tarefas' 
AND column_name = 'categoria'; 