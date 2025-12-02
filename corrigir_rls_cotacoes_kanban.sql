ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cotacoes_select_by_empresa ON public.cotacoes;
CREATE POLICY cotacoes_select_by_empresa
  ON public.cotacoes
  FOR SELECT
  TO authenticated
  USING (
    empresa_id IN (
      SELECT empresa_id FROM public.usuarios_empresas WHERE usuario_id = auth.uid()
    )
    OR empresa_id IS NULL
  );

