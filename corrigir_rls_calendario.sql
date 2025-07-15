-- 🔧 CORREÇÃO DAS POLÍTICAS RLS DO CALENDÁRIO
-- Execute este script no SQL Editor do Supabase para corrigir o erro de cadastro

-- 1. Remover políticas antigas que estão causando erro
DROP POLICY IF EXISTS "Users can only access tarefas from their company" ON tarefas;
DROP POLICY IF EXISTS "Users can only access compromissos from their company" ON compromissos;

-- 2. Criar políticas corretas que usam user_metadata
-- POLÍTICA PARA TAREFAS
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

-- POLÍTICA PARA COMPROMISSOS
CREATE POLICY "compromissos_policy_select" 
ON compromissos 
FOR SELECT 
USING (
  empresa_id = (
    SELECT (auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id'
  )::uuid
);

CREATE POLICY "compromissos_policy_insert" 
ON compromissos 
FOR INSERT 
WITH CHECK (
  empresa_id = (
    SELECT (auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id'
  )::uuid
  AND 
  usuario_id = auth.uid()
);

CREATE POLICY "compromissos_policy_update" 
ON compromissos 
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

CREATE POLICY "compromissos_policy_delete" 
ON compromissos 
FOR DELETE 
USING (
  empresa_id = (
    SELECT (auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id'
  )::uuid
);

-- 3. Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('tarefas', 'compromissos'); 