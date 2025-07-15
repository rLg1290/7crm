-- 🔧 CORREÇÃO SIMPLES PARA TAREFAS
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar e adicionar colunas faltantes
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
    
    -- Remover colunas obsoletas se existirem
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tarefas' 
        AND column_name = 'lead_id'
    ) THEN
        ALTER TABLE tarefas DROP COLUMN lead_id;
        RAISE NOTICE 'Coluna lead_id removida';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tarefas' 
        AND column_name = 'tipo'
    ) THEN
        ALTER TABLE tarefas DROP COLUMN tipo;
        RAISE NOTICE 'Coluna tipo removida';
    END IF;
END $$;

-- 2. Remover TODAS as políticas existentes (incluindo as que dependem de lead_id)
DROP POLICY IF EXISTS "Users can only access tarefas from their company" ON tarefas;
DROP POLICY IF EXISTS "tarefas_policy_select" ON tarefas;
DROP POLICY IF EXISTS "tarefas_policy_insert" ON tarefas;
DROP POLICY IF EXISTS "tarefas_policy_update" ON tarefas;
DROP POLICY IF EXISTS "tarefas_policy_delete" ON tarefas;
DROP POLICY IF EXISTS "Usuários podem inserir tarefas da própria empresa" ON tarefas;
DROP POLICY IF EXISTS "Usuários podem ver tarefas da própria empresa" ON tarefas;
DROP POLICY IF EXISTS "Usuários podem editar tarefas da própria empresa" ON tarefas;
DROP POLICY IF EXISTS "Usuários podem deletar tarefas da própria empresa" ON tarefas;

-- Remover qualquer outra política que possa existir
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

-- 3. Criar políticas corretas
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

-- 4. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tarefas' 
ORDER BY ordinal_position;

-- 5. Verificar políticas criadas
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'tarefas'; 