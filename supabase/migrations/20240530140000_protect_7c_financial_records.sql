
-- Política para contas_pagar: Usuários só podem deletar se o fornecedor NÃO for o ID 3 (7C)
DROP POLICY IF EXISTS "Usuários podem deletar contas a pagar da sua empresa" ON contas_pagar;
CREATE POLICY "Usuários podem deletar contas a pagar da sua empresa" ON contas_pagar
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
    AND
    (fornecedor_id IS NULL OR fornecedor_id != 3) -- Bloqueia deleção se fornecedor for 7C (ID 3)
  );

-- Política para contas_pagar: Usuários só podem atualizar se o fornecedor NÃO for o ID 3 (7C)
DROP POLICY IF EXISTS "Usuários podem atualizar contas a pagar da sua empresa" ON contas_pagar;
CREATE POLICY "Usuários podem atualizar contas a pagar da sua empresa" ON contas_pagar
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
    AND
    (fornecedor_id IS NULL OR fornecedor_id != 3) -- Bloqueia atualização se fornecedor for 7C (ID 3)
  );

-- Política para contas_receber: Usuários só podem deletar se o fornecedor NÃO for o ID 3 (7C)
DROP POLICY IF EXISTS "Usuários podem deletar contas a receber da sua empresa" ON contas_receber;
CREATE POLICY "Usuários podem deletar contas a receber da sua empresa" ON contas_receber
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
    AND
    (fornecedor_id IS NULL OR fornecedor_id != 3) -- Bloqueia deleção se fornecedor for 7C (ID 3)
  );

-- Política para contas_receber: Usuários só podem atualizar se o fornecedor NÃO for o ID 3 (7C)
DROP POLICY IF EXISTS "Usuários podem atualizar contas a receber da sua empresa" ON contas_receber;
CREATE POLICY "Usuários podem atualizar contas a receber da sua empresa" ON contas_receber
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
    AND
    (fornecedor_id IS NULL OR fornecedor_id != 3) -- Bloqueia atualização se fornecedor for 7C (ID 3)
  );
