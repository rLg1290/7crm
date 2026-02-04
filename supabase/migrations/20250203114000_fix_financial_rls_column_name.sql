-- Migration to fix the column name in RLS policies (user_id -> usuario_id)

-- 1. Drop the incorrect policies
DROP POLICY IF EXISTS "Users can view financial records of their company" ON contas_pagar;
DROP POLICY IF EXISTS "Users can insert financial records for their company" ON contas_pagar;
DROP POLICY IF EXISTS "Users can update financial records for their company" ON contas_pagar;
DROP POLICY IF EXISTS "Users can delete financial records for their company" ON contas_pagar;

DROP POLICY IF EXISTS "Users can view financial records of their company" ON contas_receber;
DROP POLICY IF EXISTS "Users can insert financial records for their company" ON contas_receber;
DROP POLICY IF EXISTS "Users can update financial records for their company" ON contas_receber;
DROP POLICY IF EXISTS "Users can delete financial records for their company" ON contas_receber;

-- 2. Re-create policies with CORRECT column name (usuario_id)

-- contas_pagar
CREATE POLICY "Users can view financial records of their company"
ON contas_pagar FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
  OR
  empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
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
    SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
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
    SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
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
    SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
  )
);

-- contas_receber
CREATE POLICY "Users can view financial records of their company"
ON contas_receber FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
  OR
  empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
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
    SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
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
    SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
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
    SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
  )
);
