-- Criar tabela de cotações básica
CREATE TABLE IF NOT EXISTS cotacoes (
  id BIGSERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  cliente VARCHAR(255) NOT NULL,
  codigo VARCHAR(6) UNIQUE NOT NULL, -- Código alfanumérico único de 6 dígitos
  status VARCHAR(50) NOT NULL DEFAULT 'LEAD',
  valor DECIMAL(10,2) DEFAULT 0,
  data_viagem DATE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  destino VARCHAR(255),
  observacoes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de voos básica
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

-- Habilitar RLS (Row Level Security)
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE voos ENABLE ROW LEVEL SECURITY;

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

-- Índices para melhor performance
CREATE INDEX idx_cotacoes_status ON cotacoes(status);
CREATE INDEX idx_cotacoes_cliente ON cotacoes(cliente);
CREATE INDEX idx_cotacoes_data_criacao ON cotacoes(data_criacao);
CREATE INDEX idx_voos_cotacao_id ON voos(cotacao_id); 