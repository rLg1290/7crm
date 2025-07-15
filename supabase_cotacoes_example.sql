-- Exemplo de estrutura da tabela 'cotacoes' no Supabase
-- Execute este SQL no SQL Editor do Supabase

-- Criar tabela de cotações
CREATE TABLE IF NOT EXISTS cotacoes (
  id BIGSERIAL PRIMARY KEY,
  
  -- Dados básicos
  titulo VARCHAR(255) NOT NULL,
  cliente_id BIGINT REFERENCES clientes(id),
  cliente_nome VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'LEAD',
  valor_total DECIMAL(10,2),
  valor_entrada DECIMAL(10,2),
  forma_pagamento VARCHAR(100),
  
  -- Datas
  data_viagem DATE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Destino (do primeiro voo)
  destino VARCHAR(255),
  
  -- Observações
  observacoes_venda TEXT,
  observacoes_gerais TEXT,
  
  -- Dados de passageiros
  numero_adultos INTEGER DEFAULT 1,
  numero_criancas INTEGER DEFAULT 0,
  numero_bebes INTEGER DEFAULT 0,
  
  -- Dados de hotéis
  incluir_hotel BOOLEAN DEFAULT FALSE,
  nome_hotel VARCHAR(255),
  categoria_hotel VARCHAR(100),
  tipo_quarto VARCHAR(100),
  regime_alimentacao VARCHAR(100),
  observacoes_hotel TEXT,
  
  -- Dados de serviços
  incluir_servicos BOOLEAN DEFAULT FALSE,
  traslados BOOLEAN DEFAULT FALSE,
  passeios TEXT,
  guia BOOLEAN DEFAULT FALSE,
  seguro_viagem BOOLEAN DEFAULT FALSE,
  observacoes_servicos TEXT,
  
  -- Dados de roteiro
  dias_viagem INTEGER,
  itinerario TEXT,
  pontos_interesse TEXT,
  observacoes_roteiro TEXT,
  
  -- Dados de passageiros
  observacoes_passageiros TEXT,
  
  -- Usuário que criou
  usuario_id UUID REFERENCES auth.users(id),
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de voos (relacionada com cotações)
CREATE TABLE IF NOT EXISTS voos (
  id BIGSERIAL PRIMARY KEY,
  cotacao_id BIGINT REFERENCES cotacoes(id) ON DELETE CASCADE,
  
  direcao VARCHAR(20) NOT NULL, -- 'IDA', 'VOLTA', 'INTERNO'
  origem VARCHAR(255) NOT NULL,
  destino VARCHAR(255) NOT NULL,
  data_ida DATE,
  data_volta DATE,
  classe VARCHAR(100) NOT NULL,
  companhia VARCHAR(255) NOT NULL,
  numero_voo VARCHAR(50) NOT NULL,
  horario_partida TIME NOT NULL,
  horario_chegada TIME NOT NULL,
  observacoes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de passageiros (relacionada com cotações)
CREATE TABLE IF NOT EXISTS passageiros (
  id BIGSERIAL PRIMARY KEY,
  cotacao_id BIGINT REFERENCES cotacoes(id) ON DELETE CASCADE,
  
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- 'adulto', 'crianca', 'bebe'
  cliente_id BIGINT REFERENCES clientes(id),
  data_nascimento DATE,
  documento VARCHAR(50),
  tipo_documento VARCHAR(20), -- 'cpf', 'passaporte'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voos ENABLE ROW LEVEL SECURITY;
ALTER TABLE passageiros ENABLE ROW LEVEL SECURITY;

-- Políticas para cotações
CREATE POLICY "Usuários autenticados podem ler cotações" ON cotacoes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir cotações" ON cotacoes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar cotações" ON cotacoes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar cotações" ON cotacoes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para voos
CREATE POLICY "Usuários autenticados podem ler voos" ON voos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir voos" ON voos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar voos" ON voos
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar voos" ON voos
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para passageiros
CREATE POLICY "Usuários autenticados podem ler passageiros" ON passageiros
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir passageiros" ON passageiros
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar passageiros" ON passageiros
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar passageiros" ON passageiros
  FOR DELETE USING (auth.role() = 'authenticated');

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_cotacoes_updated_at 
  BEFORE UPDATE ON cotacoes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voos_updated_at 
  BEFORE UPDATE ON voos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_passageiros_updated_at 
  BEFORE UPDATE ON passageiros 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_cotacoes_status ON cotacoes(status);
CREATE INDEX idx_cotacoes_cliente_id ON cotacoes(cliente_id);
CREATE INDEX idx_cotacoes_usuario_id ON cotacoes(usuario_id);
CREATE INDEX idx_cotacoes_data_criacao ON cotacoes(data_criacao);

CREATE INDEX idx_voos_cotacao_id ON voos(cotacao_id);
CREATE INDEX idx_passageiros_cotacao_id ON passageiros(cotacao_id); 