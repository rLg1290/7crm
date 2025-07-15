-- 🔧 CORREÇÃO DAS POLÍTICAS RLS DA TABELA TAREFAS
-- Execute este script no SQL Editor do Supabase para corrigir o erro 400

-- 1. Remover políticas antigas que estão causando erro
DROP POLICY IF EXISTS "Users can only access tarefas from their company" ON tarefas;

-- 2. Criar políticas corretas que usam user_metadata
CREATE POLICY "tarefas_policy_select" 
ON tarefas 
FOR SELECT 
USING (
  empresa_id = (
    SELECT (auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id'
  )::uuid
);

CREATE POLICY "tarefas_policy_insert" 
ON tarefas 
FOR INSERT 
WITH CHECK (
  empresa_id = (
    SELECT (auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id'
  )::uuid
  AND 
  usuario_id = auth.uid()
);

CREATE POLICY "tarefas_policy_update" 
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

CREATE POLICY "tarefas_policy_delete" 
ON tarefas 
FOR DELETE 
USING (
  empresa_id = (
    SELECT (auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id'
  )::uuid
);

-- 3. Verificar se a tabela tarefas tem a estrutura correta
-- Se não tiver, criar com a estrutura correta
DO $$
BEGIN
    -- Verificar se a coluna usuario_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tarefas' 
        AND column_name = 'usuario_id'
    ) THEN
        -- Adicionar coluna usuario_id se não existir
        ALTER TABLE tarefas ADD COLUMN usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Verificar se a coluna notificacoes existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tarefas' 
        AND column_name = 'notificacoes'
    ) THEN
        -- Adicionar coluna notificacoes se não existir
        ALTER TABLE tarefas ADD COLUMN notificacoes BOOLEAN DEFAULT true;
    END IF;
    
    -- Verificar se a coluna lead_id existe e remover se existir (não é mais usada)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tarefas' 
        AND column_name = 'lead_id'
    ) THEN
        -- Remover coluna lead_id se existir
        ALTER TABLE tarefas DROP COLUMN IF EXISTS lead_id;
    END IF;
    
    -- Verificar se a coluna tipo existe e remover se existir (não é mais usada)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tarefas' 
        AND column_name = 'tipo'
    ) THEN
        -- Remover coluna tipo se existir
        ALTER TABLE tarefas DROP COLUMN IF EXISTS tipo;
    END IF;
END $$;

-- 4. Verificar estrutura final da tabela
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
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'tarefas'; 