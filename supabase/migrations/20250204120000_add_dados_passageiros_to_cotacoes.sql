-- Add dados_passageiros JSONB column to cotacoes table
-- This allows storing a snapshot of passenger data at the time of emission
ALTER TABLE cotacoes ADD COLUMN IF NOT EXISTS dados_passageiros JSONB;
