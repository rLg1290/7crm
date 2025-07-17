-- Script para inserir cotações de teste com status EMITIDO
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos verificar se existe alguma empresa
SELECT id, nome FROM empresas LIMIT 1;

-- Inserir cotações de teste com status EMITIDO para hoje
-- Substitua 'SEU_EMPRESA_ID_AQUI' pelo ID da sua empresa

INSERT INTO cotacoes (
  titulo,
  cliente,
  codigo,
  status,
  valor,
  data_criacao,
  empresa_id,
  observacoes
) VALUES 
(
  'João Silva - Viagem para Paris',
  'João Silva',
  'COT0001',
  'EMITIDO',
  2500.00,
  CURRENT_TIMESTAMP,
  (SELECT id FROM empresas LIMIT 1),
  'Viagem de teste para Paris'
),
(
  'Maria Santos - Pacote Cancún',
  'Maria Santos',
  'COT0002',
  'EMITIDO',
  3200.00,
  CURRENT_TIMESTAMP,
  (SELECT id FROM empresas LIMIT 1),
  'Pacote de teste para Cancún'
),
(
  'Pedro Costa - Europa',
  'Pedro Costa',
  'COT0003',
  'EMITIDO',
  1800.00,
  CURRENT_TIMESTAMP,
  (SELECT id FROM empresas LIMIT 1),
  'Viagem de teste para Europa'
)
ON CONFLICT (codigo) DO NOTHING;

-- Verificar se as cotações foram inseridas
SELECT 
  id,
  titulo,
  cliente,
  codigo,
  status,
  valor,
  data_criacao,
  DATE(data_criacao) as data_criacao_date
FROM cotacoes 
WHERE status = 'EMITIDO'
  AND DATE(data_criacao) = CURRENT_DATE
ORDER BY data_criacao DESC;

-- Verificar total de vendas de hoje
SELECT 
  COUNT(*) as total_cotacoes_hoje,
  SUM(valor) as total_vendas_hoje,
  AVG(valor) as ticket_medio_hoje
FROM cotacoes 
WHERE status = 'EMITIDO'
  AND DATE(data_criacao) = CURRENT_DATE; 