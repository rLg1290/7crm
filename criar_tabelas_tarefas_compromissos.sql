-- Criar tabela tarefas
CREATE TABLE IF NOT EXISTS tarefas (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL DEFAULT 'CALL',
  data_limite TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
  prioridade VARCHAR(50) NOT NULL DEFAULT 'MEDIA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela compromissos
CREATE TABLE IF NOT EXISTS compromissos (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'CALL',
  local VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'AGENDADO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tarefas_lead_id ON tarefas(lead_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_limite ON tarefas(data_limite);
CREATE INDEX IF NOT EXISTS idx_compromissos_lead_id ON compromissos(lead_id);
CREATE INDEX IF NOT EXISTS idx_compromissos_data_hora ON compromissos(data_hora);
CREATE INDEX IF NOT EXISTS idx_compromissos_status ON compromissos(status);

-- Habilitar RLS (Row Level Security)
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE compromissos ENABLE ROW LEVEL SECURITY;

-- Políticas para tarefas
CREATE POLICY "Usuários podem ver tarefas da própria empresa" ON tarefas
  FOR ALL USING (
    lead_id IN (
      SELECT l.id FROM leads l 
      JOIN clientes c ON l.cliente_id = c.id 
      WHERE c.empresa_id = ((auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id')::uuid
    )
  );

-- Políticas para compromissos
CREATE POLICY "Usuários podem ver compromissos da própria empresa" ON compromissos
  FOR ALL USING (
    lead_id IN (
      SELECT l.id FROM leads l 
      JOIN clientes c ON l.cliente_id = c.id 
      WHERE c.empresa_id = ((auth.jwt() ->> 'user_metadata')::json ->> 'empresa_id')::uuid
    )
  );

-- Triggers para atualizar updated_at
CREATE TRIGGER update_tarefas_updated_at 
  BEFORE UPDATE ON tarefas 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compromissos_updated_at 
  BEFORE UPDATE ON compromissos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 