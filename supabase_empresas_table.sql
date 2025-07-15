-- Criar tabela empresas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  codigo_agencia VARCHAR(7) NOT NULL UNIQUE,
  logotipo TEXT, -- URL da logo da empresa
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_empresas_codigo_agencia ON empresas(codigo_agencia);
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_ativo ON empresas(ativo);

-- Habilitar RLS (Row Level Security)
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura dos códigos de agência durante cadastro
CREATE POLICY "Qualquer um pode verificar códigos de agência" ON empresas
  FOR SELECT USING (ativo = true);

-- Política para administradores (caso queira gerenciar pelo app depois)
CREATE POLICY "Administradores podem gerenciar empresas" ON empresas
  FOR ALL USING (
    -- Apenas usuários com papel de admin podem modificar
    auth.jwt() ->> 'role' = 'admin'
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_empresas_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_empresas_updated_at 
  BEFORE UPDATE ON empresas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_empresas_updated_at_column();

-- Inserir alguns exemplos (remover em produção)
INSERT INTO empresas (nome, cnpj, codigo_agencia, logotipo) VALUES 
('7C Turismo', '12.345.678/0001-90', '1001', 'https://via.placeholder.com/80x80/3B82F6/FFFFFF?text=7C'),
('Viagens & Cia', '98.765.432/0001-10', '2001', 'https://via.placeholder.com/80x80/10B981/FFFFFF?text=V%26C'),
('Turismo Total', '11.222.333/0001-44', '3001', 'https://via.placeholder.com/80x80/F59E0B/FFFFFF?text=TT')
ON CONFLICT (codigo_agencia) DO NOTHING; 