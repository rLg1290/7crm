-- Script para inserir categorias de exemplo e verificar funcionamento
-- Execute este script APÓS executar o script anterior

-- 1. Verificar se os novos tipos foram aceitos
SELECT DISTINCT tipo FROM categorias ORDER BY tipo;

-- 2. Inserir mais categorias de exemplo para cada tipo
INSERT INTO categorias (nome, tipo, descricao, user_id) VALUES
-- Comissões de Venda (receitas)
('Comissão de Vendas Diretas', 'COMISSAOVENDA', 'Comissões recebidas por vendas diretas', NULL),
('Comissão de Afiliados', 'COMISSAOVENDA', 'Comissões recebidas de afiliados', NULL),
('Comissão de Parcerias', 'COMISSAOVENDA', 'Comissões recebidas de parcerias comerciais', NULL),
('Comissão de Indicadores', 'COMISSAOVENDA', 'Comissões recebidas por indicações', NULL),

-- Comissões de Custo (despesas)
('Comissão de Vendedores', 'COMISSAOCUSTO', 'Comissões pagas aos vendedores', NULL),
('Comissão de Representantes', 'COMISSAOCUSTO', 'Comissões pagas aos representantes', NULL),
('Comissão de Marketing Digital', 'COMISSAOCUSTO', 'Comissões pagas por marketing digital', NULL),
('Comissão de Agências', 'COMISSAOCUSTO', 'Comissões pagas a agências parceiras', NULL)
ON CONFLICT (nome, tipo, user_id) DO NOTHING;

-- 3. Verificar todas as categorias organizadas por tipo
SELECT 
    CASE 
        WHEN tipo = 'CUSTO' THEN '🟥 CUSTO (Despesas)'
        WHEN tipo = 'VENDA' THEN '🟢 VENDA (Receitas)'
        WHEN tipo = 'COMISSAOVENDA' THEN '🟦 COMISSAOVENDA (Receitas de Comissão)'
        WHEN tipo = 'COMISSAOCUSTO' THEN '🟨 COMISSAOCUSTO (Despesas de Comissão)'
        ELSE tipo
    END as tipo_formatado,
    COUNT(*) as quantidade,
    STRING_AGG(nome, ', ') as categorias
FROM categorias 
GROUP BY tipo 
ORDER BY 
    CASE tipo
        WHEN 'CUSTO' THEN 1
        WHEN 'COMISSAOCUSTO' THEN 2
        WHEN 'VENDA' THEN 3
        WHEN 'COMISSAOVENDA' THEN 4
        ELSE 5
    END;

-- 4. Verificar se não há duplicatas
SELECT nome, tipo, COUNT(*) as quantidade
FROM categorias 
GROUP BY nome, tipo 
HAVING COUNT(*) > 1;

-- 5. Verificar estrutura final da tabela
SELECT 
    'Estrutura da tabela categorias:' as info,
    '' as detalhes
UNION ALL
SELECT 
    column_name,
    data_type || ' - ' || 
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END ||
    CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'categorias'
ORDER BY ordinal_position;

-- 6. Verificar constraints aplicadas
SELECT 
    'Constraints da tabela categorias:' as info,
    '' as detalhes
UNION ALL
SELECT 
    constraint_name,
    constraint_type || ' - ' || COALESCE(check_clause, 'Sem detalhes')
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'categorias'
ORDER BY tc.constraint_type, tc.constraint_name; 