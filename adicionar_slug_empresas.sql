-- Script para adicionar campo slug à tabela empresas
-- Execute este script no Supabase SQL Editor

-- 1. Adicionar coluna slug à tabela empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- 2. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug);

-- 3. Configurar slug para a empresa 7C Turismo
UPDATE empresas 
SET slug = '7c-turismo-consultoria' 
WHERE nome = '7C Turismo' AND codigo_agencia = '1001';

-- 4. Configurar slugs para outras empresas (opcional)
UPDATE empresas 
SET slug = 'viagens-cia' 
WHERE nome = 'Viagens & Cia' AND codigo_agencia = '2001';

UPDATE empresas 
SET slug = 'turismo-total' 
WHERE nome = 'Turismo Total' AND codigo_agencia = '3001';

-- 5. Verificar se as atualizações foram aplicadas
SELECT 
    id,
    nome,
    codigo_agencia,
    slug,
    ativo
FROM empresas 
ORDER BY nome;

-- 6. Testar a consulta que a página de orçamento usa
SELECT id, nome, codigo_agencia, logotipo, slug, cor_personalizada
FROM empresas 
WHERE (slug = '7c-turismo-consultoria' OR codigo_agencia = '7c-turismo-consultoria')
AND ativo = true;