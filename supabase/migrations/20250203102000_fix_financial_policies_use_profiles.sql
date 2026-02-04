-- Update RLS policies to use 'profiles' instead of 'usuarios_empresas'
-- This ensures that users created via the new RPC (which populates profiles but not usuarios_empresas) can access their data.

-- ==============================================================================
-- 2. contas_pagar
-- ==============================================================================

DROP POLICY IF EXISTS "Usuários podem ver contas a pagar da sua empresa" ON contas_pagar;
CREATE POLICY "Usuários podem ver contas a pagar da sua empresa" ON contas_pagar
  FOR SELECT USING (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Usuários podem inserir contas a pagar na sua empresa" ON contas_pagar;
CREATE POLICY "Usuários podem inserir contas a pagar na sua empresa" ON contas_pagar
  FOR INSERT WITH CHECK (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
  );

-- Note: UPDATE/DELETE policies usually have extra checks for 7C records (id=3). 
-- We need to preserve those checks but update the company verification part.
-- Checking 20240530140000_protect_7c_financial_records.sql for logic.

DROP POLICY IF EXISTS "Usuários podem atualizar contas a pagar da sua empresa" ON contas_pagar;
CREATE POLICY "Usuários podem atualizar contas a pagar da sua empresa" ON contas_pagar
  FOR UPDATE USING (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
    AND
    (fornecedor_id IS NULL OR fornecedor_id != 3) -- Block update if provider is 7C (ID 3)
  );

DROP POLICY IF EXISTS "Usuários podem deletar contas a pagar da sua empresa" ON contas_pagar;
CREATE POLICY "Usuários podem deletar contas a pagar da sua empresa" ON contas_pagar
  FOR DELETE USING (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
    AND
    (fornecedor_id IS NULL OR fornecedor_id != 3) -- Block delete if provider is 7C (ID 3)
  );

-- ==============================================================================
-- 3. contas_receber
-- ==============================================================================

DROP POLICY IF EXISTS "Usuários podem ver contas a receber da sua empresa" ON contas_receber;
CREATE POLICY "Usuários podem ver contas a receber da sua empresa" ON contas_receber
  FOR SELECT USING (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Usuários podem inserir contas a receber na sua empresa" ON contas_receber;
CREATE POLICY "Usuários podem inserir contas a receber na sua empresa" ON contas_receber
  FOR INSERT WITH CHECK (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Usuários podem atualizar contas a receber da sua empresa" ON contas_receber;
CREATE POLICY "Usuários podem atualizar contas a receber da sua empresa" ON contas_receber
  FOR UPDATE USING (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
    AND
    (fornecedor_id IS NULL OR fornecedor_id != 3)
  );

DROP POLICY IF EXISTS "Usuários podem deletar contas a receber da sua empresa" ON contas_receber;
CREATE POLICY "Usuários podem deletar contas a receber da sua empresa" ON contas_receber
  FOR DELETE USING (
    empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid())
    AND
    (fornecedor_id IS NULL OR fornecedor_id != 3)
  );
