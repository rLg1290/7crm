-- Add nome_cliente column to contas_receber to support legacy clients or clients from cards without ID
ALTER TABLE contas_receber ADD COLUMN IF NOT EXISTS nome_cliente VARCHAR;

-- Optional: Add comment to explain usage
COMMENT ON COLUMN contas_receber.nome_cliente IS 'Nome do cliente quando não há cliente_id vinculado (ex: vindo direto do card)';
