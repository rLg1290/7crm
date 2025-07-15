-- Script para adicionar coluna logotipo à tabela empresas existente
-- Execute apenas se a tabela já foi criada sem a coluna logotipo

-- Adicionar coluna logotipo se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empresas' AND column_name = 'logotipo'
    ) THEN
        ALTER TABLE empresas ADD COLUMN logotipo TEXT;
    END IF;
END $$;

-- Atualizar exemplos existentes com URLs de logo placeholder
UPDATE empresas 
SET logotipo = CASE codigo_agencia
    WHEN '1001' THEN 'https://via.placeholder.com/80x80/3B82F6/FFFFFF?text=7C'
    WHEN '2001' THEN 'https://via.placeholder.com/80x80/10B981/FFFFFF?text=V%26C'
    WHEN '3001' THEN 'https://via.placeholder.com/80x80/F59E0B/FFFFFF?text=TT'
    ELSE NULL
END
WHERE logotipo IS NULL AND codigo_agencia IN ('1001', '2001', '3001'); 