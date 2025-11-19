-- Script: adicionar_empresa_id_contas_pagar.sql
-- Objetivo: adicionar a coluna empresa_id em public.contas_pagar,
-- preencher dados legados com base em usuarios_empresas, criar FK/índice e ajustar RLS.
-- Execute no Supabase SQL Editor (ou psql) com uma sessão privilegiada (owner).

BEGIN;

-- 1) Adicionar coluna empresa_id (UUID), permitindo NULL temporariamente para migração
ALTER TABLE public.contas_pagar
  ADD COLUMN IF NOT EXISTS empresa_id uuid;

-- 2) Preencher empresa_id para registros legados com base no vínculo do usuário em usuarios_empresas
-- Observações:
--  - Considera que cada user_id possui um único vínculo ativo em usuarios_empresas.
--  - Caso existam múltiplos vínculos, ajuste a regra conforme sua necessidade de negócio.
UPDATE public.contas_pagar cp
SET empresa_id = ue.empresa_id
FROM public.usuarios_empresas ue
WHERE cp.empresa_id IS NULL
  AND ue.usuario_id = cp.user_id;

-- 3) (Opcional) Marcar como NOT NULL caso todos os registros tenham sido preenchidos
-- Verifique antes: SELECT count(*) FROM public.contas_pagar WHERE empresa_id IS NULL;
-- Se o resultado for 0, descomente a linha abaixo
-- ALTER TABLE public.contas_pagar ALTER COLUMN empresa_id SET NOT NULL;

-- 4) Criar Foreign Key para empresas.id (permite NULLs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contas_pagar_empresa_id_fkey'
  ) THEN
    ALTER TABLE public.contas_pagar
      ADD CONSTRAINT contas_pagar_empresa_id_fkey
      FOREIGN KEY (empresa_id)
      REFERENCES public.empresas (id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT;
  END IF;
END$$;

-- 5) Índice para acelerar filtros por empresa_id
CREATE INDEX IF NOT EXISTS idx_contas_pagar_empresa_id
  ON public.contas_pagar (empresa_id);

-- 6) Ajuste/garantia de RLS por empresa_id
-- Habilitar RLS, se ainda não estiver habilitado
ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas conflitantes (se existirem)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN (
    SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contas_pagar'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contas_pagar;', pol.policyname);
  END LOOP;
END$$;

-- Políticas baseadas no vínculo empresa_id em usuarios_empresas
-- SELECT: somente registros da(s) empresa(s) do usuário autenticado
CREATE POLICY contas_pagar_select_by_empresa
ON public.contas_pagar
FOR SELECT
USING (
  empresa_id IS NULL OR EXISTS (
    SELECT 1 FROM public.usuarios_empresas ue
    WHERE ue.usuario_id = auth.uid()
      AND ue.empresa_id = public.contas_pagar.empresa_id
  )
);

-- INSERT: permitir inserir apenas para empresas às quais o usuário pertence
CREATE POLICY contas_pagar_insert_by_empresa
ON public.contas_pagar
FOR INSERT
WITH CHECK (
  empresa_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.usuarios_empresas ue
    WHERE ue.usuario_id = auth.uid()
      AND ue.empresa_id = public.contas_pagar.empresa_id
  )
);

-- UPDATE: permitir atualizar apenas registros da(s) empresa(s) do usuário
CREATE POLICY contas_pagar_update_by_empresa
ON public.contas_pagar
FOR UPDATE
USING (
  empresa_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.usuarios_empresas ue
    WHERE ue.usuario_id = auth.uid()
      AND ue.empresa_id = public.contas_pagar.empresa_id
  )
)
WITH CHECK (
  empresa_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.usuarios_empresas ue
    WHERE ue.usuario_id = auth.uid()
      AND ue.empresa_id = public.contas_pagar.empresa_id
  )
);

-- DELETE: permitir deletar apenas registros da(s) empresa(s) do usuário
CREATE POLICY contas_pagar_delete_by_empresa
ON public.contas_pagar
FOR DELETE
USING (
  empresa_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.usuarios_empresas ue
    WHERE ue.usuario_id = auth.uid()
      AND ue.empresa_id = public.contas_pagar.empresa_id
  )
);

COMMIT;

-- Pós-execução sugerida:
-- 1) Conferir pendências: SELECT id FROM public.contas_pagar WHERE empresa_id IS NULL;
--    Se houver registros restantes sem empresa_id, definir manualmente conforme as regras de negócio.
-- 2) Testar no app: carregar Contas a Pagar e verificar que os dados aparecem para todos os usuários vinculados à mesma empresa.
-- 3) Caso precise tornar empresa_id obrigatório, aplicar o SET NOT NULL após preencher os dados (item 3).