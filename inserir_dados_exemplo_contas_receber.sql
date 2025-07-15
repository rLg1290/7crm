-- Script para inserir dados de exemplo na tabela contas_receber
-- Execute este script no Supabase SQL Editor após executar criar_tabelas_financeiro.sql

-- Primeiro, vamos verificar se existem empresas e clientes
SELECT 'Empresas existentes:' as info, COUNT(*) as total FROM empresas;
SELECT 'Clientes existentes:' as info, COUNT(*) as total FROM clientes;

-- Inserir dados de exemplo na tabela contas_receber
-- Nota: Substitua os UUIDs pelos IDs reais das suas empresas e clientes

INSERT INTO contas_receber (
  empresa_id,
  cliente_id,
  cliente_nome,
  descricao,
  servico,
  valor,
  vencimento,
  status,
  observacoes
) VALUES 
-- Exemplo 1: Conta pendente
(
  (SELECT id FROM empresas LIMIT 1), -- Substitua pelo ID da sua empresa
  (SELECT id FROM clientes LIMIT 1), -- Substitua pelo ID do cliente
  'João Silva',
  'Pacote de viagem para Paris',
  'Hospedagem',
  2500.00,
  '2024-02-15',
  'pendente',
  'Pacote completo com hotel 4 estrelas'
),
-- Exemplo 2: Conta recebida
(
  (SELECT id FROM empresas LIMIT 1),
  (SELECT id FROM clientes LIMIT 1),
  'Maria Santos',
  'Passagem aérea São Paulo - Nova York',
  'Transporte',
  1800.00,
  '2024-01-20',
  'recebida',
  'Passagem executiva'
),
-- Exemplo 3: Conta vencida
(
  (SELECT id FROM empresas LIMIT 1),
  (SELECT id FROM clientes LIMIT 1),
  'Pedro Costa',
  'Seguro viagem Europa',
  'Seguros',
  350.00,
  '2024-01-10',
  'vencida',
  'Seguro anual para Europa'
),
-- Exemplo 4: Conta pendente
(
  (SELECT id FROM empresas LIMIT 1),
  (SELECT id FROM clientes LIMIT 1),
  'Ana Oliveira',
  'Pacote de viagem para Japão',
  'Hospedagem',
  4200.00,
  '2024-03-01',
  'pendente',
  'Pacote com guia local'
),
-- Exemplo 5: Conta pendente
(
  (SELECT id FROM empresas LIMIT 1),
  (SELECT id FROM clientes LIMIT 1),
  'Carlos Ferreira',
  'Passagem aérea Rio - Londres',
  'Transporte',
  2200.00,
  '2024-02-28',
  'pendente',
  'Passagem econômica'
)
ON CONFLICT DO NOTHING;

-- Verificar se os dados foram inseridos
SELECT 
  cr.id,
  cr.cliente_nome,
  cr.descricao,
  cr.servico,
  cr.valor,
  cr.vencimento,
  cr.status,
  cr.created_at
FROM contas_receber cr
ORDER BY cr.vencimento ASC;

-- Contar total de contas por status
SELECT 
  status,
  COUNT(*) as total,
  SUM(valor) as valor_total
FROM contas_receber
GROUP BY status
ORDER BY status; 