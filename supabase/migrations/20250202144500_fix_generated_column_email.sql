-- Corrigir erro de coluna gerada (email em auth.identities)
-- A coluna email em auth.identities é gerada automaticamente (STORED/VIRTUAL) a partir de identity_data->>'email'
-- Não devemos tentar inserir nela diretamente.

DROP FUNCTION IF EXISTS admin_create_user(text, text, text, text, uuid);

CREATE OR REPLACE FUNCTION admin_create_user(
    p_email text,
    p_password text,
    p_nome text,
    p_role text,
    p_empresa_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  encrypted_pw text;
BEGIN
  -- 1. Verificar permissões (apenas admin pode criar)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar usuários.';
  END IF;

  -- 2. Verificar se email já existe
  IF EXISTS (SELECT 1 FROM auth.users WHERE users.email = p_email) THEN
    RAISE EXCEPTION 'Email já cadastrado.';
  END IF;

  -- 3. Gerar ID e Hash de Senha
  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(p_password, gen_salt('bf'));

  -- 4. Inserir em auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    p_email,
    encrypted_pw,
    now(), -- Auto confirm
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object(
      'nome', p_nome,
      'role', p_role,
      'empresa_id', p_empresa_id
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 5. Inserir em auth.identities (sem a coluna email explicita)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    new_user_id,
    jsonb_build_object('sub', new_user_id, 'email', p_email),
    'email',
    NULL,
    now(),
    now()
  );

  -- 6. Inserir ou Atualizar em public.profiles
  INSERT INTO public.profiles (id, email, nome, role, empresa_id)
  VALUES (new_user_id, p_email, p_nome, p_role, p_empresa_id)
  ON CONFLICT (id) DO UPDATE
  SET nome = EXCLUDED.nome,
      role = EXCLUDED.role,
      empresa_id = EXCLUDED.empresa_id;

  RETURN new_user_id;
END;
$$;
