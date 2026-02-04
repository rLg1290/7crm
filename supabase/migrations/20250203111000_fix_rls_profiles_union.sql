-- Fix Financial RLS policies to include profiles table check
-- This is necessary because some users are linked via 'profiles' and others via 'usuarios_empresas'

-- 1. Contas Pagar
DROP POLICY IF EXISTS "Usuários podem inserir contas a pagar na sua empresa" ON contas_pagar;

CREATE POLICY "Usuários podem inserir contas a pagar na sua empresa" ON contas_pagar
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
      UNION
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários podem ver contas a pagar da sua empresa" ON contas_pagar;

CREATE POLICY "Usuários podem ver contas a pagar da sua empresa" ON contas_pagar
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
      UNION
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 2. Contas Receber
DROP POLICY IF EXISTS "Usuários podem inserir contas a receber na sua empresa" ON contas_receber;

CREATE POLICY "Usuários podem inserir contas a receber na sua empresa" ON contas_receber
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
      UNION
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários podem ver contas a receber da sua empresa" ON contas_receber;

CREATE POLICY "Usuários podem ver contas a receber da sua empresa" ON contas_receber
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
      UNION
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 3. Categorias (Ensure read access)
DROP POLICY IF EXISTS "Usuários podem ver categorias da sua empresa" ON categorias;

CREATE POLICY "Usuários podem ver categorias da sua empresa" ON categorias
  FOR SELECT USING (
    -- Permite ver categorias globais (sem empresa_id) ou da própria empresa
    empresa_id IS NULL OR
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
      UNION
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
  );
