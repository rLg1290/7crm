-- Fix RLS policies to allow users to see their own records (by user_id)
-- This is critical because some records are created with user_id but might have mismatched company links

-- 1. Contas Pagar
DROP POLICY IF EXISTS "Usuários podem ver contas a pagar da sua empresa" ON contas_pagar;

CREATE POLICY "Usuários podem ver contas a pagar da sua empresa" ON contas_pagar
  FOR SELECT USING (
    -- Permite ver se pertence à empresa OU se foi criado pelo próprio usuário
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
      UNION
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
    OR
    user_id = auth.uid()
  );

-- 2. Contas Receber
DROP POLICY IF EXISTS "Usuários podem ver contas a receber da sua empresa" ON contas_receber;

CREATE POLICY "Usuários podem ver contas a receber da sua empresa" ON contas_receber
  FOR SELECT USING (
    -- Permite ver se pertence à empresa OU se foi criado pelo próprio usuário
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = auth.uid()
      UNION
      SELECT empresa_id FROM profiles WHERE id = auth.uid()
    )
    OR
    user_id = auth.uid()
  );
