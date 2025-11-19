-- =============================================================
-- Função RPC: create_cliente_lead_public
-- Objetivo: Permitir captação pública de leads sem login
-- Estratégia: SECURITY DEFINER (executa com privilégio do owner)
-- Fluxo: Resolve empresa por slug -> busca/insere cliente -> insere lead
-- Retorno: cliente_id (BIGINT), lead_id (SERIAL/INTEGER)
-- =============================================================

CREATE OR REPLACE FUNCTION public.create_cliente_lead_public(
  p_empresa_slug text,
  p_nome text,
  p_sobrenome text,
  p_email text,
  p_telefone text,
  p_observacao text
) RETURNS TABLE (cliente_id bigint, lead_id integer) AS $$
DECLARE
  v_empresa_id uuid;
BEGIN
  -- Validações básicas
  IF p_empresa_slug IS NULL OR length(trim(p_empresa_slug)) = 0 THEN
    RAISE EXCEPTION 'Slug da empresa não informado' USING ERRCODE = 'P0001';
  END IF;

  IF p_email IS NULL OR position('@' IN p_email) = 0 THEN
    RAISE EXCEPTION 'E-mail inválido' USING ERRCODE = 'P0001';
  END IF;

  -- Resolver empresa pelo slug
  SELECT e.id INTO v_empresa_id
  FROM public.empresas e
  WHERE e.slug = trim(p_empresa_slug)
  LIMIT 1;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Empresa não encontrada para slug: %', p_empresa_slug USING ERRCODE = 'P0001';
  END IF;

  -- Tentar encontrar cliente existente por email+empresa (normalizando email)
  SELECT c.id INTO cliente_id
  FROM public.clientes c
  WHERE c.email = trim(lower(p_email))
    AND c.empresa_id = v_empresa_id
  LIMIT 1;

  -- Se não encontrado, criar cliente
  IF cliente_id IS NULL THEN
    INSERT INTO public.clientes (nome, sobrenome, email, telefone, empresa_id)
    VALUES (
      trim(p_nome),
      trim(p_sobrenome),
      trim(lower(p_email)),
      trim(p_telefone),
      v_empresa_id
    )
    RETURNING id INTO cliente_id;
  END IF;

  -- Inserir lead vinculado ao cliente e empresa
  INSERT INTO public.leads (cliente_id, observacao, empresa_id)
  VALUES (cliente_id, p_observacao, v_empresa_id)
  RETURNING id INTO lead_id;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Permitir que a role anon execute a função (para página pública)
GRANT EXECUTE ON FUNCTION public.create_cliente_lead_public(
  text, text, text, text, text, text
) TO anon;

-- =============================================================
-- Notas:
-- 1) Esta função pressupõe que a tabela `leads` tem as colunas:
--    id SERIAL, cliente_id BIGINT, empresa_id UUID, observacao TEXT,
--    created_at TIMESTAMP (e opcionalmente updated_at).
-- 2) A função contorna RLS internamente (SECURITY DEFINER), mantendo
--    controle de segurança no backend. Não expõe service role no cliente.
-- 3) O frontend deve chamar via:
--    supabase.rpc('create_cliente_lead_public', {
--      p_empresa_slug: '<slug-da-empresa>',
--      p_nome: '...', p_sobrenome: '...', p_email: '...', p_telefone: '...', p_observacao: '...'
--    })
-- 4) Opcional: adicionar validações anti-spam, limites de tamanho e logs.
-- =============================================================