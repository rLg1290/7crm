-- Script para adicionar campo data_conclusao nas tabelas

-- Adicionar coluna data_conclusao na tabela tarefas
ALTER TABLE tarefas 
ADD COLUMN IF NOT EXISTS data_conclusao TIMESTAMPTZ;

-- Adicionar coluna data_conclusao na tabela compromissos
ALTER TABLE compromissos 
ADD COLUMN IF NOT EXISTS data_conclusao TIMESTAMPTZ;

-- Criar indices para melhor performance na limpeza automatica
CREATE INDEX IF NOT EXISTS idx_tarefas_status_conclusao 
ON tarefas(status, data_conclusao);

CREATE INDEX IF NOT EXISTS idx_compromissos_status_conclusao 
ON compromissos(status, data_conclusao);

-- Comentarios das colunas
COMMENT ON COLUMN tarefas.data_conclusao IS 'Data e hora de conclusao da tarefa';
COMMENT ON COLUMN compromissos.data_conclusao IS 'Data e hora de realizacao do compromisso'; 