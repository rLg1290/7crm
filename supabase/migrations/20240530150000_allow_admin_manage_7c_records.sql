-- Allow Admins to UPDATE contas_pagar
CREATE POLICY "Admins can update any contas_pagar" ON contas_pagar
FOR UPDATE USING (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Allow Admins to DELETE contas_pagar
CREATE POLICY "Admins can delete any contas_pagar" ON contas_pagar
FOR DELETE USING (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Allow Admins to UPDATE contas_receber
CREATE POLICY "Admins can update any contas_receber" ON contas_receber
FOR UPDATE USING (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Allow Admins to DELETE contas_receber
CREATE POLICY "Admins can delete any contas_receber" ON contas_receber
FOR DELETE USING (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);
