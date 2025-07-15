-- =====================================================
-- CORREÇÃO COMPLETA - CÓDIGOS DE AGÊNCIA
-- =====================================================
-- Este script resolve o problema do VARCHAR(7) e gera códigos seguros
-- =====================================================

-- 1. Verificar situação atual
SELECT 'SITUAÇÃO ATUAL:' as info;
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'empresas' 
AND column_name = 'codigo_agencia';

SELECT 'DADOS ATUAIS:' as info;
SELECT id, nome, codigo_agencia, length(codigo_agencia) as tamanho
FROM empresas 
ORDER BY created_at;

-- 2. Corrigir o tamanho do campo (VARCHAR(7) -> VARCHAR(9))
ALTER TABLE empresas 
ALTER COLUMN codigo_agencia TYPE VARCHAR(9);

-- 3. Verificar se a correção foi bem-sucedida
SELECT 'CAMPO CORRIGIDO:' as info;
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'empresas' 
AND column_name = 'codigo_agencia';

-- 4. Criar função para gerar código aleatório de 9 dígitos
CREATE OR REPLACE FUNCTION gerar_codigo_9_digitos()
RETURNS TEXT AS $$
DECLARE
    codigo TEXT := '';
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    i INTEGER;
BEGIN
    FOR i IN 1..9 LOOP
        codigo := codigo || substr(chars, 1 + floor(random() * length(chars))::INTEGER, 1);
    END LOOP;
    RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar função para gerar código único
CREATE OR REPLACE FUNCTION gerar_codigo_unico()
RETURNS TEXT AS $$
DECLARE
    codigo TEXT;
    tentativas INTEGER := 0;
    max_tentativas INTEGER := 50;
BEGIN
    LOOP
        codigo := gerar_codigo_9_digitos();
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

-- 6. Corrigir empresa com código 0
UPDATE empresas 
SET codigo_agencia = gerar_codigo_unico()
WHERE codigo_agencia = '0';

-- 7. Corrigir qualquer outra empresa com código inválido
UPDATE empresas 
SET codigo_agencia = gerar_codigo_unico()
WHERE 
    codigo_agencia IS NULL 
    OR length(codigo_agencia) != 9 
    OR codigo_agencia ~ '^[A-Z0-9]{9}$' = false;

-- 8. Verificar resultado final
SELECT 'RESULTADO FINAL:' as info;
SELECT 
    id,
    nome,
    codigo_agencia,
    length(codigo_agencia) as tamanho,
    ativo
FROM empresas 
ORDER BY created_at;

-- 9. Verificar se não há duplicatas
SELECT 'VERIFICAÇÃO DE DUPLICATAS:' as info;
SELECT codigo_agencia, COUNT(*) as total
FROM empresas 
WHERE codigo_agencia IS NOT NULL
GROUP BY codigo_agencia 
HAVING COUNT(*) > 1;

-- 10. Estatísticas finais
SELECT 'ESTATÍSTICAS FINAIS:' as info;
SELECT 
    COUNT(*) as total_empresas,
    COUNT(CASE WHEN codigo_agencia IS NOT NULL THEN 1 END) as com_codigo,
    COUNT(CASE WHEN length(codigo_agencia) = 9 THEN 1 END) as com_9_digitos,
    COUNT(CASE WHEN codigo_agencia ~ '^[A-Z0-9]{9}$' THEN 1 END) as formato_correto
FROM empresas;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- - Campo codigo_agencia: VARCHAR(9)
-- - Empresa com código 0: Corrigida para código de 9 dígitos
-- - Formato: A-Z, 0-9 (exemplo: A1B2C3D4E)
-- - Sem duplicatas
-- ===================================================== 