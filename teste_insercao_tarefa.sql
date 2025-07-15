-- 🧪 TESTE DE INSERÇÃO DE TAREFA
-- Execute este script para testar se a inserção funciona

-- 1. Verificar estrutura atual da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tarefas' 
ORDER BY ordinal_position;

-- 2. Verificar políticas atuais
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'tarefas';

-- 3. Tentar inserir uma tarefa de teste
-- (Comente esta linha se não quiser inserir dados de teste)
-- INSERT INTO tarefas (
--   titulo,
--   descricao,
--   prioridade,
--   status,
--   data_vencimento,
--   hora_vencimento,
--   responsavel,
--   categoria,
--   empresa_id,
--   usuario_id,
--   cliente,
--   notificacoes
-- ) VALUES (
--   'Teste de Check-in',
--   'Tarefa de teste para verificar inserção',
--   'media',
--   'pendente',
--   CURRENT_DATE + INTERVAL '2 days',
--   '10:00',
--   'Sistema',
--   'viagem',
--   (SELECT (auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id')::uuid,
--   auth.uid(),
--   'Cliente Teste',
--   true
-- ); 