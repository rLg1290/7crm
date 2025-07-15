-- 🚀 CONECTAR COTAÇÕES ÀS EMPRESAS - Execute no Supabase

-- 1️⃣ Primeiro, veja quais empresas você tem:
SELECT id, nome, cnpj FROM empresas;

-- 2️⃣ Veja quantas cotações não têm empresa_id:
SELECT COUNT(*) as cotacoes_sem_empresa FROM cotacoes WHERE empresa_id IS NULL;

-- 3️⃣ Conectar todas as cotações à primeira empresa (ou escolha uma específica):
UPDATE cotacoes 
SET empresa_id = (SELECT id FROM empresas LIMIT 1) 
WHERE empresa_id IS NULL;

-- 4️⃣ Verificar se funcionou:
SELECT 
  c.id,
  c.titulo,
  c.empresa_id,
  e.nome as nome_empresa
FROM cotacoes c
LEFT JOIN empresas e ON c.empresa_id = e.id
LIMIT 5;

-- 5️⃣ Se quiser conectar a uma empresa específica (substitua o ID):
-- UPDATE cotacoes SET empresa_id = 'SEU_ID_EMPRESA_AQUI' WHERE empresa_id IS NULL; 