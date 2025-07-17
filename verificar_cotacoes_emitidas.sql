-- Script para verificar cotações emitidas e seus valores
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar todas as cotações com status EMITIDO
SELECT 
  id,
  titulo,
  cliente,
  status,
  valor,
  data_criacao,
  empresa_id,
  DATE(data_criacao) as data_criacao_date
FROM cotacoes 
WHERE status = 'EMITIDO'
ORDER BY data_criacao DESC;

-- 2. Verificar cotações emitidas de hoje
SELECT 
  id,
  titulo,
  cliente,
  status,
  valor,
  data_criacao,
  empresa_id,
  DATE(data_criacao) as data_criacao_date
FROM cotacoes 
WHERE status = 'EMITIDO'
  AND DATE(data_criacao) = CURRENT_DATE
ORDER BY data_criacao DESC;

-- 3. Verificar total de vendas de hoje
SELECT 
  COUNT(*) as total_cotacoes_hoje,
  SUM(valor) as total_vendas_hoje,
  AVG(valor) as ticket_medio_hoje
FROM cotacoes 
WHERE status = 'EMITIDO'
  AND DATE(data_criacao) = CURRENT_DATE;

-- 4. Verificar todas as cotações por status
SELECT 
  status,
  COUNT(*) as quantidade,
  SUM(valor) as valor_total,
  AVG(valor) as valor_medio
FROM cotacoes 
GROUP BY status
ORDER BY status;

-- 5. Verificar se há cotações sem valor
SELECT 
  id,
  titulo,
  cliente,
  status,
  valor,
  data_criacao
FROM cotacoes 
WHERE status = 'EMITIDO'
  AND (valor IS NULL OR valor = 0)
ORDER BY data_criacao DESC; 