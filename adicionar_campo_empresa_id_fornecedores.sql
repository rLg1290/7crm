-- Adicionar campo empresa_id na tabela fornecedores
ALTER TABLE fornecedores 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- Verificar a estrutura atualizada da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fornecedores' 
ORDER BY ordinal_position;

-- Verificar fornecedores existentes
SELECT 
    id,
    nome,
    cnpj,
    email,
    telefone,
    cidade,
    estado,
    user_id,
    empresa_id,
    created_at
FROM fornecedores 
ORDER BY nome; 