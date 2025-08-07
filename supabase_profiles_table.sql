-- Criar tabela profiles para gerenciar roles dos usuários
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in_at TIMESTAMP WITH TIME ZONE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_empresa_id ON profiles(empresa_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para leitura de perfis (permite durante autenticação)
CREATE POLICY "Leitura de perfis" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR  -- Usuário pode ver seu próprio perfil
    auth.uid() IS NULL  -- Permite leitura durante processo de autenticação
  );

-- Política para usuários atualizarem apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar apenas seu próprio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Política para administradores gerenciarem todos os perfis
CREATE POLICY "Administradores podem gerenciar todos os perfis" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política para inserção de novos perfis (apenas admins ou auto-inserção)
CREATE POLICY "Inserção de perfis" ON profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, empresa_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'empresa_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'empresa_id')::UUID
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_profiles_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profiles_updated_at_column();

-- Inserir perfil para usuários existentes (se houver)
-- ATENÇÃO: Execute apenas uma vez e adapte conforme necessário
/*
INSERT INTO profiles (id, email, role, empresa_id)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'role', 'user') as role,
  CASE 
    WHEN raw_user_meta_data->>'empresa_id' IS NOT NULL 
    THEN (raw_user_meta_data->>'empresa_id')::UUID
    ELSE NULL
  END as empresa_id
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
*/

-- Criar um usuário admin padrão (opcional - descomente e configure)
/*
-- Primeiro, crie o usuário no painel do Supabase ou via código
-- Depois execute este comando para torná-lo admin:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'seu-email-admin@exemplo.com';
*/