-- Corrigir constraint de categoria na tabela tarefas para permitir 'checkin'
-- Execução: cole este script no SQL Editor do Supabase e execute.

BEGIN;

-- 1) Remover a constraint atual, se existir
ALTER TABLE public.tarefas DROP CONSTRAINT IF EXISTS tarefas_categoria_check;

-- 2) Recriar a constraint incluindo 'checkin' na lista permitida
ALTER TABLE public.tarefas
ADD CONSTRAINT tarefas_categoria_check
CHECK (categoria IN ('vendas', 'atendimento', 'administrativo', 'reuniao', 'viagem', 'checkin'));

COMMIT;

-- Após executar, reemita a cotação com voo que tenha abertura_checkin preenchida.
-- A tarefa deverá ser criada com categoria = 'checkin'.