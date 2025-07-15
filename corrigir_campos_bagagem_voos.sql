-- Script para corrigir campos de bagagem na tabela voos
-- Alterar de TEXT para INTEGER para armazenar apenas números
-- Executar no Supabase SQL Editor

-- Verificar se os campos existem como TEXT e alterar para INTEGER
DO $$
BEGIN
    -- Verificar e alterar bagagem_despachada
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'voos' 
        AND column_name = 'bagagem_despachada' 
        AND data_type = 'text'
    ) THEN
        -- Alterar tipo de dados (converter JSON existente para número se necessário)
        ALTER TABLE voos ALTER COLUMN bagagem_despachada TYPE INTEGER 
        USING CASE 
            WHEN bagagem_despachada ~ '^\d+$' THEN bagagem_despachada::INTEGER
            WHEN bagagem_despachada LIKE '%"quantidade":%' THEN 
                (bagagem_despachada::json->>'quantidade')::INTEGER
            ELSE 0
        END;
        
        -- Definir valor padrão
        ALTER TABLE voos ALTER COLUMN bagagem_despachada SET DEFAULT 0;
    END IF;

    -- Verificar e alterar bagagem_mao
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'voos' 
        AND column_name = 'bagagem_mao' 
        AND data_type = 'text'
    ) THEN
        -- Alterar tipo de dados (converter JSON existente para número se necessário)
        ALTER TABLE voos ALTER COLUMN bagagem_mao TYPE INTEGER 
        USING CASE 
            WHEN bagagem_mao ~ '^\d+$' THEN bagagem_mao::INTEGER
            WHEN bagagem_mao LIKE '%"quantidade":%' THEN 
                (bagagem_mao::json->>'quantidade')::INTEGER
            ELSE 0
        END;
        
        -- Definir valor padrão
        ALTER TABLE voos ALTER COLUMN bagagem_mao SET DEFAULT 0;
    END IF;
END $$;

-- Atualizar comentários dos campos
COMMENT ON COLUMN voos.bagagem_despachada IS 'Quantidade de bagagem despachada (número inteiro)';
COMMENT ON COLUMN voos.bagagem_mao IS 'Quantidade de bagagem de mão (número inteiro)';

-- Verificar resultado
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    col_description(pgc.oid, cols.ordinal_position) as column_comment
FROM information_schema.columns cols
JOIN pg_class pgc ON pgc.relname = cols.table_name
WHERE cols.table_name = 'voos' 
AND cols.column_name IN ('bagagem_despachada', 'bagagem_mao')
ORDER BY cols.ordinal_position; 