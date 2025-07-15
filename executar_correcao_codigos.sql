-- =====================================================
-- CORREÇÃO RÁPIDA - CÓDIGOS DE AGÊNCIA
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Verificar situação atual
SELECT 'SITUAÇÃO ATUAL:' as info;
SELECT id, nome, codigo_agencia, ativo FROM empresas ORDER BY created_at;

-- 2. Criar função para gerar código aleatório de 9 dígitos
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

-- 3. Corrigir empresa com código 0
UPDATE empresas 
SET codigo_agencia = gerar_codigo_9_digitos()
WHERE codigo_agencia = '0';

-- 4. Verificar resultado
SELECT 'RESULTADO FINAL:' as info;
SELECT id, nome, codigo_agencia, length(codigo_agencia) as tamanho FROM empresas ORDER BY created_at;

-- 5. Confirmar que está correto
SELECT 'CONFIRMAÇÃO:' as info;
SELECT 
    COUNT(*) as total_empresas,
    COUNT(CASE WHEN length(codigo_agencia) = 9 THEN 1 END) as com_9_digitos,
    COUNT(CASE WHEN codigo_agencia ~ '^[A-Z0-9]{9}$' THEN 1 END) as formato_correto
FROM empresas; 