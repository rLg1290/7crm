-- Add snapshot columns to cotacao_passageiros
-- This allows storing passenger data independently of the clientes table
ALTER TABLE cotacao_passageiros 
ADD COLUMN IF NOT EXISTS nome text,
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS data_nascimento date,
ADD COLUMN IF NOT EXISTS email text;

-- Optional: Fix RLS on clientes to allow reading if user is admin/support (Generic approach)
-- We won't apply RLS changes blindly to avoid security risks, but the columns above help.
