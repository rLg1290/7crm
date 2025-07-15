-- Criar tabela clientes
CREATE TABLE IF NOT EXISTS clientes (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  sobrenome VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  data_nascimento DATE NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  rg VARCHAR(20),
  passaporte VARCHAR(20),
  data_expedicao DATE,
  data_expiracao DATE,
  nacionalidade VARCHAR(50) DEFAULT 'Brasileira',
  rede_social VARCHAR(255),
  observacoes TEXT,
  empresa_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome, sobrenome);

-- Habilitar RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política atualizada para usuários só verem clientes da própria empresa
CREATE POLICY "Usuários podem ver apenas clientes da própria empresa" ON clientes
  FOR ALL USING (
    empresa_id = ((auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id')::uuid
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_clientes_updated_at 
  BEFORE UPDATE ON clientes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 