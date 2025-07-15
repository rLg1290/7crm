-- Script de Debug para tabela empresas no Supabase
-- Execute cada comando separadamente no SQL Editor do Supabase

-- 1. Verificar se a tabela existe
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'empresas';

-- 2. Verificar estrutura da tabela (substituindo \d)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'empresas' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Contar registros
SELECT COUNT(*) as total FROM empresas;

-- 4. Listar todas as empresas
SELECT id, nome, cnpj, created_at FROM empresas;

-- 5. Verificar RLS (Row Level Security)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'empresas';

-- 6. Verificar se o ID específico existe
SELECT id, nome, cnpj 
FROM empresas 
WHERE id = '8e23591e-e0af-42f8-a002-6df935bab14a';

-- 7. Teste de consulta simples sem filtros
SELECT id, nome FROM empresas LIMIT 1;

-- 8. Verificar permissões de usuário atual
SELECT current_user, session_user;

-- 9. Se a tabela não existir, criar uma básica
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cnpj TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    cor_personalizada TEXT DEFAULT '#0d9488',
    logotipo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Inserir uma empresa de teste se não existir
INSERT INTO empresas (id, nome, cnpj, telefone, email, endereco, cor_personalizada)
SELECT 
    '8e23591e-e0af-42f8-a002-6df935bab14a'::uuid,
    'Agência de Turismo Exemplo',
    '12.345.678/0001-90',
    '(11) 99999-9999',
    'contato@agencia.com.br',
    'Rua Principal, 123 - Centro',
    '#2563eb'
WHERE NOT EXISTS (
    SELECT 1 FROM empresas WHERE id = '8e23591e-e0af-42f8-a002-6df935bab14a'::uuid
);

-- 11. Verificar se funcionou
SELECT * FROM empresas; 