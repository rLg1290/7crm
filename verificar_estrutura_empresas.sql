-- Verificar estrutura da tabela empresas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'empresas' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar dados existentes
SELECT * FROM empresas LIMIT 3;

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'empresas';

-- Teste simples de busca
SELECT id, nome FROM empresas WHERE id = '8e23591e-e0af-42f8-a002-6df935bab14a';

-- Verificar se o UUID existe
SELECT COUNT(*) as total_empresas FROM empresas;
SELECT id, nome, cnpj FROM empresas; 