-- Permitir que Admins vejam e gerenciem TODAS as contas a pagar e receber (Financeiro Global)

-- 1. Contas Pagar
CREATE POLICY "Admins podem ver todas contas a pagar" ON contas_pagar
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins podem inserir contas a pagar" ON contas_pagar
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins podem atualizar todas contas a pagar" ON contas_pagar
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins podem deletar todas contas a pagar" ON contas_pagar
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- 2. Contas Receber
CREATE POLICY "Admins podem ver todas contas a receber" ON contas_receber
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins podem inserir contas a receber" ON contas_receber
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins podem atualizar todas contas a receber" ON contas_receber
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Admins podem deletar todas contas a receber" ON contas_receber
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
