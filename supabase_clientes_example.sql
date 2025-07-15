-- Exemplo de estrutura da tabela 'clientes' no Supabase
-- Execute este SQL no SQL Editor do Supabase

-- Criar tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  cpf VARCHAR(14) UNIQUE,
  data_nascimento DATE,
  endereco TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura para usuários autenticados
CREATE POLICY "Usuários autenticados podem ler clientes" ON clientes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir inserção para usuários autenticados
CREATE POLICY "Usuários autenticados podem inserir clientes" ON clientes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para permitir atualização para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar clientes" ON clientes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para permitir exclusão para usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar clientes" ON clientes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Inserir alguns clientes de exemplo
INSERT INTO clientes (nome, email, telefone, cpf, data_nascimento, endereco) VALUES
  ('João Silva', 'joao@email.com', '(11) 99999-9999', '123.456.789-00', '1985-03-15', 'Rua das Flores, 123 - São Paulo/SP'),
  ('Maria Santos', 'maria@email.com', '(11) 88888-8888', '987.654.321-00', '1990-07-22', 'Av. Paulista, 456 - São Paulo/SP'),
  ('Pedro Oliveira', 'pedro@email.com', '(11) 77777-7777', '456.789.123-00', '1988-11-10', 'Rua Augusta, 789 - São Paulo/SP'),
  ('Ana Costa', 'ana@email.com', '(11) 66666-6666', '789.123.456-00', '1992-05-18', 'Rua Oscar Freire, 321 - São Paulo/SP'),
  ('Carlos Ferreira', 'carlos@email.com', '(11) 55555-5555', '321.654.987-00', '1983-09-25', 'Av. Brigadeiro Faria Lima, 654 - São Paulo/SP');

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_clientes_updated_at 
  BEFORE UPDATE ON clientes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 