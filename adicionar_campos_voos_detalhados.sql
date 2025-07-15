-- Script para adicionar campos detalhados na tabela de voos
-- Executar no Supabase SQL Editor

-- Adicionar novos campos na tabela voos
ALTER TABLE voos 
ADD COLUMN IF NOT EXISTS localizador VARCHAR(20),
ADD COLUMN IF NOT EXISTS duracao VARCHAR(10),
ADD COLUMN IF NOT EXISTS numero_compra VARCHAR(50),
ADD COLUMN IF NOT EXISTS abertura_checkin TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bagagem_despachada TEXT,
ADD COLUMN IF NOT EXISTS bagagem_mao TEXT;

-- Comentários explicativos dos campos
COMMENT ON COLUMN voos.localizador IS 'Código localizador da reserva (ex: ABC123)';
COMMENT ON COLUMN voos.duracao IS 'Duração do voo (ex: 2h30m)';
COMMENT ON COLUMN voos.numero_compra IS 'Número da compra/bilhete';
COMMENT ON COLUMN voos.abertura_checkin IS 'Data e hora de abertura do check-in';
COMMENT ON COLUMN voos.bagagem_despachada IS 'Informações sobre bagagem despachada (JSON ou texto)';
COMMENT ON COLUMN voos.bagagem_mao IS 'Informações sobre bagagem de mão (JSON ou texto)';

-- Verificar se os campos foram adicionados
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'voos' 
AND table_schema = 'public'
ORDER BY ordinal_position; 