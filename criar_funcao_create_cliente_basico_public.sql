CREATE OR REPLACE FUNCTION public.create_cliente_basico_public(
  p_empresa_slug text,
  p_nome_completo text,
  p_cpf text DEFAULT NULL,
  p_data_nascimento date DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empresa_id uuid;
  v_nome_full text;
  v_nome text;
  v_sobrenome text;
  v_cliente_id bigint;
BEGIN
  SELECT id INTO v_empresa_id FROM public.empresas WHERE slug = p_empresa_slug;
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Empresa não encontrada para slug %', p_empresa_slug USING ERRCODE = 'foreign_key_violation';
  END IF;

  v_nome_full := trim(regexp_replace(coalesce(p_nome_completo, ''), '\s+', ' ', 'g'));
  IF v_nome_full = '' THEN
    RAISE EXCEPTION 'Nome completo é obrigatório' USING ERRCODE = 'not_null_violation';
  END IF;

  v_nome := split_part(v_nome_full, ' ', 1);
  IF position(' ' in v_nome_full) > 0 THEN
    v_sobrenome := trim(substring(v_nome_full from position(' ' in v_nome_full)+1));
  ELSE
    v_sobrenome := NULL;
  END IF;

  INSERT INTO public.clientes (nome, sobrenome, cpf, data_nascimento, email, telefone, empresa_id)
  VALUES (v_nome, v_sobrenome, p_cpf, p_data_nascimento, NULL, NULL, v_empresa_id)
  RETURNING id INTO v_cliente_id;

  RETURN v_cliente_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_cliente_basico_public(text, text, text, date) TO anon, authenticated;