-- =====================================================
-- CORREÇÃO DE CÓDIGOS DE AGÊNCIA - SISTEMA 7C
-- =====================================================
-- Data: Dezembro 2024
-- Objetivo: Gerar códigos seguros e aleatórios de 9 dígitos
-- =====================================================

-- 1. Primeiro, vamos verificar a estrutura atual da tabela
SELECT 
    id,
    nome,
    codigo_agencia,
    ativo,
    created_at
FROM empresas 
ORDER BY created_at;

-- 2. Função para gerar código aleatório de 9 dígitos (letras e números)
CREATE OR REPLACE FUNCTION gerar_codigo_agencia()
RETURNS TEXT AS $$
DECLARE
    codigo TEXT;
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    i INTEGER;
    char_pos INTEGER;
BEGIN
    -- Gerar código de 9 caracteres
    codigo := '';
    FOR i IN 1..9 LOOP
        -- Gerar posição aleatória
        char_pos := 1 + floor(random() * length(chars))::INTEGER;
        -- Adicionar caractere aleatório
        codigo := codigo || substr(chars, char_pos, 1);
    END LOOP;
    
    RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- 3. Função para gerar código único (verificando se já existe)
CREATE OR REPLACE FUNCTION gerar_codigo_agencia_unico()
RETURNS TEXT AS $$
DECLARE
    codigo TEXT;
    tentativas INTEGER := 0;
    max_tentativas INTEGER := 100;
BEGIN
    LOOP
        codigo := gerar_codigo_agencia();
        tentativas := tentativas + 1;
        
        -- Verificar se o código já existe
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

-- 4. Atualizar a empresa existente (código 0) com um novo código seguro
UPDATE empresas 
SET codigo_agencia = gerar_codigo_agencia_unico()
WHERE codigo_agencia = '0' OR codigo_agencia IS NULL;

-- 5. Verificar se há outras empresas com códigos inválidos e corrigir
UPDATE empresas 
SET codigo_agencia = gerar_codigo_agencia_unico()
WHERE 
    codigo_agencia IS NULL 
    OR length(codigo_agencia) != 9 
    OR codigo_agencia ~ '^[A-Z0-9]{9}$' = false;

-- 6. Verificar se há códigos duplicados e corrigir
WITH duplicados AS (
    SELECT codigo_agencia, COUNT(*) as total
    FROM empresas 
    WHERE codigo_agencia IS NOT NULL
    GROUP BY codigo_agencia 
    HAVING COUNT(*) > 1
)
UPDATE empresas 
SET codigo_agencia = gerar_codigo_agencia_unico()
WHERE codigo_agencia IN (SELECT codigo_agencia FROM duplicados);

-- 7. Verificar o resultado final
SELECT 
    id,
    nome,
    codigo_agencia,
    length(codigo_agencia) as tamanho_codigo,
    ativo,
    created_at
FROM empresas 
ORDER BY created_at;

-- 8. Verificar se todos os códigos estão corretos
SELECT 
    'Verificação de códigos' as tipo,
    COUNT(*) as total_empresas,
    COUNT(CASE WHEN codigo_agencia IS NOT NULL THEN 1 END) as com_codigo,
    COUNT(CASE WHEN length(codigo_agencia) = 9 THEN 1 END) as codigo_9_digitos,
    COUNT(CASE WHEN codigo_agencia ~ '^[A-Z0-9]{9}$' THEN 1 END) as formato_correto
FROM empresas;

-- 9. Verificar se há duplicatas
SELECT 
    'Verificação de duplicatas' as tipo,
    codigo_agencia,
    COUNT(*) as total_duplicatas
FROM empresas 
WHERE codigo_agencia IS NOT NULL
GROUP BY codigo_agencia 
HAVING COUNT(*) > 1;

-- =====================================================
-- INSTRUÇÕES PARA EXECUÇÃO:
-- =====================================================
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique os resultados das consultas
-- 3. Se houver erros, execute novamente
-- 4. Confirme que todos os códigos têm 9 dígitos
-- =====================================================

-- 10. Função para gerar código manual (para uso futuro)
CREATE OR REPLACE FUNCTION gerar_codigo_agencia_manual()
RETURNS TEXT AS $$
BEGIN
    RETURN gerar_codigo_agencia_unico();
END;
$$ LANGUAGE plpgsql;

-- 11. Exemplo de uso da função manual
-- SELECT gerar_codigo_agencia_manual();

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- - Códigos gerados: 9 caracteres (A-Z, 0-9)
-- - Formato: XXXXX-XXXX (exemplo: A1B2C3D4E)
-- - Únicos: Não há duplicatas
-- - Seguros: Aleatórios e imprevisíveis
-- ===================================================== 