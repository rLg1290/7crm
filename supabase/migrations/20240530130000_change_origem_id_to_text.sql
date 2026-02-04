
-- Alterar origem_id para TEXT para suportar tanto IDs numéricos (BigInt) quanto UUIDs
ALTER TABLE contas_pagar ALTER COLUMN origem_id TYPE text USING origem_id::text;
ALTER TABLE contas_receber ALTER COLUMN origem_id TYPE text USING origem_id::text;
