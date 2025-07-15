-- Script para verificar e corrigir dados da tabela contas_receber
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe e sua estrutura
SELECT 'Verificando estrutura da tabela contas_receber:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contas_receber'
ORDER BY ordinal_position;

-- 2. Verificar se há dados na tabela
SELECT 'Verificando dados existentes:' as info;
SELECT COUNT(*) as total_registros FROM contas_receber;

-- 3. Verificar registros com empresa_id
SELECT 'Registros com empresa_id:' as info;
SELECT 
  id,
  empresa_id,
  cliente_nome,
  descricao,
  servico,
  valor,
  vencimento,
  status,
  created_at
FROM contas_receber
ORDER BY created_at DESC;

-- 4. Verificar se há registros sem empresa_id
SELECT 'Registros SEM empresa_id:' as info;
SELECT COUNT(*) as registros_sem_empresa_id 
FROM contas_receber 
WHERE empresa_id IS NULL;

-- 5. Verificar empresas existentes
SELECT 'Empresas existentes:' as info;
SELECT id, nome FROM empresas LIMIT 5;

-- 6. Verificar relacionamentos usuarios_empresas
SELECT 'Relacionamentos usuarios_empresas:' as info;
SELECT 
  ue.usuario_id,
  ue.empresa_id,
  e.nome as nome_empresa
FROM usuarios_empresas ue
LEFT JOIN empresas e ON ue.empresa_id = e.id
LIMIT 5;

-- 7. Se houver registros sem empresa_id, atualizar com a primeira empresa disponível
-- (Descomente as linhas abaixo se necessário)
/*
UPDATE contas_receber 
SET empresa_id = (SELECT id FROM empresas LIMIT 1)
WHERE empresa_id IS NULL;
*/

-- 8. Inserir dados de exemplo se não houver nenhum registro
-- (Descomente as linhas abaixo se necessário)
/*
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
(
  (SELECT id FROM empresas LIMIT 1),
  NULL,
  'João Silva',
  'Pacote de viagem para Paris',
  'Hospedagem',
  2500.00,
  '2024-08-15',
  'pendente',
  'Pacote completo com hotel 4 estrelas'
),
(
  (SELECT id FROM empresas LIMIT 1),
  NULL,
  'Maria Santos',
  'Passagem aérea São Paulo - Nova York',
  'Transporte',
  1800.00,
  '2024-08-20',
  'pendente',
  'Passagem executiva'
)
ON CONFLICT DO NOTHING;
*/

-- 9. Verificar resultado final
SELECT 'Resultado final - Contas a receber:' as info;
SELECT 
  id,
  empresa_id,
  cliente_nome,
  descricao,
  servico,
  valor,
  vencimento,
  status
FROM contas_receber
ORDER BY created_at DESC; 