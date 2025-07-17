-- Script para verificar campos faltantes na tabela contas_receber
-- Execute este script no Supabase SQL Editor

--1rificar se a tabela existe
SELECTVerificando se a tabela existe:' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema =public' 
    AND table_name = contas_receber'
) as tabela_existe;

-- 2. Verificar a estrutura atual da tabela
SELECT 'Estrutura atual da tabela contas_receber:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name =contas_receber
ORDER BY ordinal_position;

-- 3. Listar campos que o código está tentando inserir
SELECT 'Campos que o código está tentando inserir:' as info;
SELECT 'empresa_id' as campo_necessario, 'UUID as tipo_esperado
UNION ALL SELECT user_id', 'UUIDUNION ALL SELECT 'cliente_id', 'UUIDUNION ALL SELECT cliente_nome,VARCHAR(255)UNION ALL SELECT descricao', 'TEXTUNION ALL SELECT 'servico,VARCHAR(100)UNION ALL SELECT valor', DECIMAL(10,2)UNION ALL SELECT 'vencimento', 'DATEUNION ALL SELECT status', 'VARCHAR(20)UNION ALL SELECTcategoria_id, INTEGERUNION ALL SELECT forma_recebimento_id, INTEGERUNION ALL SELECT 'parcelas', 'VARCHAR(10)UNION ALL SELECT origem', 'VARCHAR(50)UNION ALL SELECT 'origem_id,VARCHAR(255)UNION ALL SELECT created_at',TIMESTAMP'
ORDER BY campo_necessario;

-- 4ficar quais campos estão faltando
SELECT 'Campos FALTANDO na tabela:' as info;
SELECT 
    c.campo_necessario,
    c.tipo_esperado,
    CASE 
        WHEN tc.column_name IS NULL THEN '❌ FALTANDO'
        ELSE ✅EXISTE'
    END as status
FROM (
    SELECT 'empresa_id' as campo_necessario, 'UUID as tipo_esperado
    UNION ALL SELECT user_id', 'UUID'
    UNION ALL SELECT 'cliente_id', 'UUID'
    UNION ALL SELECT cliente_nome,VARCHAR(255  UNION ALL SELECT descricao', 'TEXT'
    UNION ALL SELECT 'servico,VARCHAR(10  UNION ALL SELECT valor', 'DECIMAL(10,2)'
    UNION ALL SELECT 'vencimento', 'DATE'
    UNION ALL SELECT status',VARCHAR(20  UNION ALL SELECTcategoria_id', 'INTEGER'
    UNION ALL SELECT forma_recebimento_id', 'INTEGER'
    UNION ALL SELECT 'parcelas',VARCHAR(10  UNION ALL SELECT origem',VARCHAR(50  UNION ALL SELECT 'origem_id,VARCHAR(255  UNION ALL SELECT created_at, 'TIMESTAMP'
) c
LEFT JOIN information_schema.columns tc 
    ON tc.table_name = contas_receber' 
    AND tc.column_name = c.campo_necessario
ORDER BY 
    CASE WHEN tc.column_name IS NULL THEN0 ELSE 1 END,
    c.campo_necessario;

-- 5ificar se há dados na tabela
SELECTDados existentes na tabela:' as info;
SELECT COUNT(*) as total_registros FROM contas_receber;

-- 6. Verificar registros existentes (se houver)
SELECT Últimos registros (se houver):' as info;
SELECT 
    id,
    empresa_id,
    cliente_id,
    cliente_nome,
    descricao,
    servico,
    valor,
    vencimento,
    status,
    origem,
    origem_id,
    user_id,
    created_at
FROM contas_receber
ORDER BY created_at DESC
LIMIT 5;

-- 7. Verificar constraints da tabela
SELECT 'Constraints da tabela:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name =contas_receber'
ORDER BY tc.constraint_type, kcu.column_name; 