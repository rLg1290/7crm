-- =====================================================
-- CORREÇÃO DO CAMPO CODIGO_AGENCIA - SISTEMA 7C
-- =====================================================
-- Problema: Campo VARCHAR(7) é muito pequeno para 9 dígitos
-- Solução: Alterar para VARCHAR(9)
-- =====================================================

-- 1. Verificar a estrutura atual da tabela
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'empresas' 
AND column_name = 'codigo_agencia';

-- 2. Verificar se há dados que podem ser afetados
SELECT 'DADOS ATUAIS:' as info;
SELECT id, nome, codigo_agencia, length(codigo_agencia) as tamanho
FROM empresas 
ORDER BY created_at;

-- 3. Alterar o campo para VARCHAR(9)
ALTER TABLE empresas 
ALTER COLUMN codigo_agencia TYPE VARCHAR(9);

-- 4. Verificar se a alteração foi bem-sucedida
SELECT 'ESTRUTURA APÓS ALTERAÇÃO:' as info;
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'empresas' 
AND column_name = 'codigo_agencia';

-- 5. Verificar se os dados foram preservados
SELECT 'DADOS APÓS ALTERAÇÃO:' as info;
SELECT id, nome, codigo_agencia, length(codigo_agencia) as tamanho
FROM empresas 
ORDER BY created_at;

-- 6. Agora podemos executar a correção dos códigos
-- (Execute o script executar_correcao_codigos.sql após este) 