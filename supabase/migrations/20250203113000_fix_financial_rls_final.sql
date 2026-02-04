-- Migration to fix RLS policies for financial tables (contas_pagar, contas_receber)
-- supporting both profiles.empresa_id and usuarios_empresas table for company linkage.

-- 1. Drop existing restrictive policies to start fresh for these specific tables
DROP POLICY IF EXISTS "Users can view financial records of their company" ON contas_pagar;
DROP POLICY IF EXISTS "Users can insert financial records for their company" ON contas_pagar;
DROP POLICY IF EXISTS "Users can update financial records for their company" ON contas_pagar;
DROP POLICY IF EXISTS "Users can delete financial records for their company" ON contas_pagar;

DROP POLICY IF EXISTS "Users can view financial records of their company" ON contas_receber;
DROP POLICY IF EXISTS "Users can insert financial records for their company" ON contas_receber;
DROP POLICY IF EXISTS "Users can update financial records for their company" ON contas_receber;
DROP POLICY IF EXISTS "Users can delete financial records for their company" ON contas_receber;

-- 2. Create unified policies for contas_pagar

CREATE POLICY "Users can view financial records of their company"
ON contas_pagar FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
  OR
  empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert financial records for their company"
ON contas_pagar FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
  OR
  empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update financial records for their company"
ON contas_pagar FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
  OR
  empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete financial records for their company"
ON contas_pagar FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
  OR
  empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
);

-- 3. Create unified policies for contas_receber

CREATE POLICY "Users can view financial records of their company"
ON contas_receber FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
  OR
  empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert financial records for their company"
ON contas_receber FOR INSERT
WITH CHECK (
  empresa_id IN (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
  OR
  empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update financial records for their company"
ON contas_receber FOR UPDATE
USING (
  empresa_id IN (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
  OR
  empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete financial records for their company"
ON contas_receber FOR DELETE
USING (
  empresa_id IN (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
  OR
  empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  )
);

-- 4. Ensure RLS is enabled
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;

-- 5. Explicitly grant permissions to authenticated role (just to be safe)
GRANT ALL ON contas_pagar TO authenticated;
GRANT ALL ON contas_receber TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE contas_pagar_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE contas_receber_id_seq TO authenticated;
