-- Ensure RLS is enabled
ALTER TABLE IF EXISTS contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contas_receber ENABLE ROW LEVEL SECURITY;

-- 1. Policies for contas_pagar

-- Drop existing INSERT policy if it exists to ensure we have a clean slate
DROP POLICY IF EXISTS "Usuários podem inserir contas a pagar na sua empresa" ON contas_pagar;

-- Create the INSERT policy
CREATE POLICY "Usuários podem inserir contas a pagar na sua empresa" ON contas_pagar
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

-- 2. Policies for contas_receber

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Usuários podem inserir contas a receber na sua empresa" ON contas_receber;

-- Create the INSERT policy
CREATE POLICY "Usuários podem inserir contas a receber na sua empresa" ON contas_receber
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

-- 3. Ensure usuarios_empresas is readable by the user (Required for the subquery above to work)
-- We'll try to add this policy safely. If RLS is enabled on usuarios_empresas, this is needed.
-- If RLS is not enabled, this policy won't do anything until it is enabled, but it's safe to add.

ALTER TABLE IF EXISTS usuarios_empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas próprias vinculações" ON usuarios_empresas;

CREATE POLICY "Usuários podem ver suas próprias vinculações" ON usuarios_empresas
  FOR SELECT USING (
    usuario_id = auth.uid()
  );
