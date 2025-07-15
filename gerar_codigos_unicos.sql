-- =====================================================
-- GERAR CÓDIGOS ÚNICOS - SEM DUPLICATAS
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Verificar se há duplicatas atualmente
SELECT 'VERIFICANDO DUPLICATAS:' as info;
SELECT codigo_agencia, COUNT(*) as total
FROM empresas 
WHERE codigo_agencia IS NOT NULL
GROUP BY codigo_agencia 
HAVING COUNT(*) > 1;

-- 2. Função para gerar código único (verificando duplicatas)
CREATE OR REPLACE FUNCTION gerar_codigo_unico()
RETURNS TEXT AS $$
DECLARE
    codigo TEXT;
    tentativas INTEGER := 0;
    max_tentativas INTEGER := 50;
BEGIN
    LOOP
        -- Gerar código aleatório
        codigo := '';
        FOR i IN 1..9 LOOP
            codigo := codigo || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 
                                     1 + floor(random() * 36)::INTEGER, 1);
        END LOOP;
        
        tentativas := tentativas + 1;
        
        -- Verificar se já existe
        IF NOT EXISTS (SELECT 1 FROM empresas WHERE codigo_agencia = codigo) THEN
            RETURN codigo;
        END IF;
        
        -- Evitar loop infinito
        IF tentativas >= max_tentativas THEN
            RAISE EXCEPTION 'Não foi possível gerar código único após % tentativas', max_tentativas;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Corrigir empresa com código 0 usando função única
UPDATE empresas 
SET codigo_agencia = gerar_codigo_unico()
WHERE codigo_agencia = '0';

-- 4. Corrigir qualquer outra empresa com código inválido
UPDATE empresas 
SET codigo_agencia = gerar_codigo_unico()
WHERE 
    codigo_agencia IS NULL 
    OR length(codigo_agencia) != 9 
    OR codigo_agencia ~ '^[A-Z0-9]{9}$' = false;

-- 5. Verificar resultado final
SELECT 'RESULTADO FINAL:' as info;
SELECT 
    id,
    nome,
    codigo_agencia,
    length(codigo_agencia) as tamanho,
    ativo
FROM empresas 
ORDER BY created_at;

-- 6. Verificar se não há mais duplicatas
SELECT 'VERIFICAÇÃO FINAL - DUPLICATAS:' as info;
SELECT codigo_agencia, COUNT(*) as total
FROM empresas 
WHERE codigo_agencia IS NOT NULL
GROUP BY codigo_agencia 
HAVING COUNT(*) > 1;

-- 7. Estatísticas finais
SELECT 'ESTATÍSTICAS FINAIS:' as info;
SELECT 
    COUNT(*) as total_empresas,
    COUNT(CASE WHEN codigo_agencia IS NOT NULL THEN 1 END) as com_codigo,
    COUNT(CASE WHEN length(codigo_agencia) = 9 THEN 1 END) as com_9_digitos,
    COUNT(CASE WHEN codigo_agencia ~ '^[A-Z0-9]{9}$' THEN 1 END) as formato_correto
FROM empresas; 