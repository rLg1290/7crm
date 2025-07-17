-- Script para corrigir problemas na tabela contas_receber
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'contas_receber'
) as tabela_existe;

-- 2. Verificar a estrutura atual da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contas_receber'
ORDER BY ordinal_position;

-- 3. Adicionar campos faltantes se não existirem
DO $$
BEGIN
    -- Adicionar campo empresa_id se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_receber'
        AND column_name = 'empresa_id'
    ) THEN
        ALTER TABLE contas_receber ADD COLUMN empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE;
        RAISE NOTICE 'Campo empresa_id adicionado à tabela contas_receber';
    ELSE
        RAISE NOTICE 'Campo empresa_id já existe na tabela contas_receber';
    END IF;

    -- Adicionar campo user_id se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_receber'
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE contas_receber ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Campo user_id adicionado à tabela contas_receber';
    ELSE
        RAISE NOTICE 'Campo user_id já existe na tabela contas_receber';
    END IF;

    -- Adicionar campo categoria_id se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_receber'
        AND column_name = 'categoria_id'
    ) THEN
        ALTER TABLE contas_receber ADD COLUMN categoria_id INTEGER;
        RAISE NOTICE 'Campo categoria_id adicionado à tabela contas_receber';
    ELSE
        RAISE NOTICE 'Campo categoria_id já existe na tabela contas_receber';
    END IF;

    -- Adicionar campo forma_recebimento_id se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_receber'
        AND column_name = 'forma_recebimento_id'
    ) THEN
        ALTER TABLE contas_receber ADD COLUMN forma_recebimento_id INTEGER;
        RAISE NOTICE 'Campo forma_recebimento_id adicionado à tabela contas_receber';
    ELSE
        RAISE NOTICE 'Campo forma_recebimento_id já existe na tabela contas_receber';
    END IF;

    -- Adicionar campo parcelas se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_receber'
        AND column_name = 'parcelas'
    ) THEN
        ALTER TABLE contas_receber ADD COLUMN parcelas VARCHAR(10);
        RAISE NOTICE 'Campo parcelas adicionado à tabela contas_receber';
    ELSE
        RAISE NOTICE 'Campo parcelas já existe na tabela contas_receber';
    END IF;

    -- Adicionar campo origem se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_receber'
        AND column_name = 'origem'
    ) THEN
        ALTER TABLE contas_receber ADD COLUMN origem VARCHAR(50) DEFAULT 'MANUAL';
        RAISE NOTICE 'Campo origem adicionado à tabela contas_receber';
    ELSE
        RAISE NOTICE 'Campo origem já existe na tabela contas_receber';
    END IF;

    -- Adicionar campo origem_id se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_receber'
        AND column_name = 'origem_id'
    ) THEN
        ALTER TABLE contas_receber ADD COLUMN origem_id VARCHAR(255);
        RAISE NOTICE 'Campo origem_id adicionado à tabela contas_receber';
    ELSE
        RAISE NOTICE 'Campo origem_id já existe na tabela contas_receber';
    END IF;

    -- Adicionar campo created_at se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_receber'
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE contas_receber ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Campo created_at adicionado à tabela contas_receber';
    ELSE
        RAISE NOTICE 'Campo created_at já existe na tabela contas_receber';
    END IF;

    -- Adicionar campo updated_at se não existir
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'contas_receber'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE contas_receber ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Campo updated_at adicionado à tabela contas_receber';
    ELSE
        RAISE NOTICE 'Campo updated_at já existe na tabela contas_receber';
    END IF;
END $$;

-- 4. Verificar se há registros sem empresa_id e atualizar
SELECT COUNT(*) as registros_sem_empresa_id 
FROM contas_receber 
WHERE empresa_id IS NULL;

-- 5. Atualizar registros sem empresa_id (se houver)
UPDATE contas_receber 
SET empresa_id = (
    SELECT empresa_id 
    FROM usuarios_empresas 
    WHERE usuario_id = contas_receber.user_id 
    LIMIT 1
)
WHERE empresa_id IS NULL AND user_id IS NOT NULL;

-- 6. Habilitar RLS (Row Level Security)
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS para contas_receber
DROP POLICY IF EXISTS "Usuários podem ver contas a receber da sua empresa" ON contas_receber;
CREATE POLICY "Usuários podem ver contas a receber da sua empresa" ON contas_receber
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários podem inserir contas a receber na sua empresa" ON contas_receber;
CREATE POLICY "Usuários podem inserir contas a receber na sua empresa" ON contas_receber
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários podem atualizar contas a receber da sua empresa" ON contas_receber;
CREATE POLICY "Usuários podem atualizar contas a receber da sua empresa" ON contas_receber
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários podem deletar contas a receber da sua empresa" ON contas_receber;
CREATE POLICY "Usuários podem deletar contas a receber da sua empresa" ON contas_receber
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

-- 8. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contas_receber_empresa_id ON contas_receber(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_user_id ON contas_receber(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contas_receber(status);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON contas_receber(vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_receber_origem ON contas_receber(origem, origem_id);

-- 9. Verificar a estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contas_receber' 
ORDER BY ordinal_position;

-- 10. Verificar dados existentes
SELECT 
    id,
    empresa_id,
    cliente_id,
    cliente_nome,
    descricao,
    servico,
    valor,
    vencimento,
    status,
    origem,
    origem_id,
    user_id,
    created_at
FROM contas_receber
ORDER BY created_at DESC
LIMIT 10; 