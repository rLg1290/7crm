-- 🔧 CORREÇÃO COMPLETA PARA TAREFAS
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilitar RLS temporariamente
ALTER TABLE tarefas DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'tarefas'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON tarefas';
        RAISE NOTICE 'Política removida: %', policy_record.policyname;
    END LOOP;
END $$;

-- 3. Verificar e adicionar colunas faltantes
DO $$
BEGIN
    -- Adicionar usuario_id se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tarefas' 
        AND column_name = 'usuario_id'
    ) THEN
        ALTER TABLE tarefas ADD COLUMN usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Coluna usuario_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna usuario_id já existe';
    END IF;
    
    -- Adicionar notificacoes se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tarefas' 
        AND column_name = 'notificacoes'
    ) THEN
        ALTER TABLE tarefas ADD COLUMN notificacoes BOOLEAN DEFAULT true;
        RAISE NOTICE 'Coluna notificacoes adicionada';
    ELSE
        RAISE NOTICE 'Coluna notificacoes já existe';
    END IF;
END $$;

-- 4. Remover colunas obsoletas (agora que não há políticas dependentes)
DO $$
BEGIN
    -- Remover lead_id se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tarefas' 
        AND column_name = 'lead_id'
    ) THEN
        ALTER TABLE tarefas DROP COLUMN lead_id;
        RAISE NOTICE 'Coluna lead_id removida';
    ELSE
        RAISE NOTICE 'Coluna lead_id não existe';
    END IF;
    
    -- Remover tipo se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tarefas' 
        AND column_name = 'tipo'
    ) THEN
        ALTER TABLE tarefas DROP COLUMN tipo;
        RAISE NOTICE 'Coluna tipo removida';
    ELSE
        RAISE NOTICE 'Coluna tipo não existe';
    END IF;
END $$;

-- 5. Reabilitar RLS
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas corretas
CREATE POLICY "tarefas_select_policy" 
ON tarefas 
FOR SELECT 
USING (
  empresa_id = (
    SELECT (auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id'
  )::uuid
);

CREATE POLICY "tarefas_insert_policy" 
ON tarefas 
FOR INSERT 
WITH CHECK (
  empresa_id = (
    SELECT (auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id'
  )::uuid
  AND 
  usuario_id = auth.uid()
);

CREATE POLICY "tarefas_update_policy" 
ON tarefas 
FOR UPDATE 
USING (
  empresa_id = (
    SELECT (auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id'
  )::uuid
)
WITH CHECK (
  empresa_id = (
    SELECT (auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id'
  )::uuid
);

CREATE POLICY "tarefas_delete_policy" 
ON tarefas 
FOR DELETE 
USING (
  empresa_id = (
    SELECT (auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id'
  )::uuid
);

-- 7. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tarefas' 
ORDER BY ordinal_position;

-- 8. Verificar políticas criadas
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'tarefas';

-- 9. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'tarefas'; 