-- Habilitar pgcrypto para hash de senhas
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Função para admin criar usuários sem desconectar e com auto-confirmação
CREATE OR REPLACE FUNCTION admin_create_user(
    email text,
    password text,
    nome text,
    role text,
    empresa_id uuid DEFAULT NULL
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
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar usuários.';
  END IF;

  -- 2. Verificar se email já existe
  IF EXISTS (SELECT 1 FROM auth.users WHERE users.email = admin_create_user.email) THEN
    RAISE EXCEPTION 'Email já cadastrado.';
  END IF;

  -- 3. Gerar ID e Hash de Senha
  new_user_id := gen_random_uuid();
  encrypted_pw := crypt(password, gen_salt('bf'));

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
    email,
    encrypted_pw,
    now(), -- Auto confirm
    '{"provider": "email", "providers": ["email"]}',
    jsonb_build_object(
      'nome', nome,
      'role', role,
      'empresa_id', empresa_id
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 5. Inserir em auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    email
  ) VALUES (
    new_user_id, -- Usando o mesmo ID para simplificar, ou gerar um novo se necessário
    new_user_id,
    jsonb_build_object('sub', new_user_id, 'email', email),
    'email',
    NULL,
    now(),
    now(),
    email
  );

  -- 6. Inserir ou Atualizar em public.profiles
  -- A trigger on_auth_user_created pode já ter criado o profile.
  INSERT INTO public.profiles (id, email, nome, role, empresa_id)
  VALUES (new_user_id, email, nome, role, empresa_id)
  ON CONFLICT (id) DO UPDATE
  SET nome = EXCLUDED.nome,
      role = EXCLUDED.role,
      empresa_id = EXCLUDED.empresa_id;

  RETURN new_user_id;
END;
$$;
