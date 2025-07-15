-- 🚀 EXECUTE ESTE SQL NO SUPABASE AGORA MESMO

-- 1️⃣ Adicionar campo empresa_id à tabela cotações
ALTER TABLE cotacoes 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- 2️⃣ Para conectar cotações existentes, use uma empresa padrão
-- Substitua 'ID_DA_SUA_EMPRESA' pelo ID real da sua empresa na tabela empresas

-- Primeiro, veja qual empresa você tem:
-- SELECT id, nome FROM empresas;

-- Depois execute um dos comandos abaixo:
-- OPÇÃO A: Se você souber o ID da empresa, substitua abaixo:
-- UPDATE cotacoes SET empresa_id = 'SEU_ID_AQUI' WHERE empresa_id IS NULL;

-- OPÇÃO B: Usar a primeira empresa disponível automaticamente:
UPDATE cotacoes 
SET empresa_id = (SELECT id FROM empresas LIMIT 1) 
WHERE empresa_id IS NULL;

-- 3️⃣ Verificar se deu certo:
-- SELECT id, titulo, empresa_id FROM cotacoes LIMIT 5; 