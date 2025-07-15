-- Tabela de Tarefas
CREATE TABLE IF NOT EXISTS tarefas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  prioridade VARCHAR(10) CHECK (prioridade IN ('alta', 'media', 'baixa')) DEFAULT 'media',
  status VARCHAR(20) CHECK (status IN ('pendente', 'em-andamento', 'concluida', 'cancelada')) DEFAULT 'pendente',
  data_vencimento DATE NOT NULL,
  hora_vencimento TIME,
  responsavel VARCHAR(255) NOT NULL,
  categoria VARCHAR(20) CHECK (categoria IN ('vendas', 'atendimento', 'administrativo', 'reuniao', 'viagem')) DEFAULT 'vendas',
  cliente VARCHAR(255),
  notificacoes BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Compromissos
CREATE TABLE IF NOT EXISTS compromissos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  tipo VARCHAR(20) CHECK (tipo IN ('reuniao', 'ligacao', 'atendimento', 'viagem', 'evento')) DEFAULT 'reuniao',
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  local VARCHAR(255),
  participantes TEXT[], -- Array de strings
  descricao TEXT,
  status VARCHAR(20) CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'realizado')) DEFAULT 'agendado',
  cliente VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tarefas_empresa_id ON tarefas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_usuario_id ON tarefas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_vencimento ON tarefas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);

CREATE INDEX IF NOT EXISTS idx_compromissos_empresa_id ON compromissos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_compromissos_usuario_id ON compromissos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_compromissos_data ON compromissos(data);
CREATE INDEX IF NOT EXISTS idx_compromissos_status ON compromissos(status);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tarefas_updated_at BEFORE UPDATE ON tarefas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compromissos_updated_at BEFORE UPDATE ON compromissos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) políticas
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE compromissos ENABLE ROW LEVEL SECURITY;

-- Política para tarefas - usuários só podem ver/editar tarefas da sua empresa
CREATE POLICY "Users can only access tarefas from their company" 
ON tarefas 
FOR ALL 
USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid);

-- Política para compromissos - usuários só podem ver/editar compromissos da sua empresa
CREATE POLICY "Users can only access compromissos from their company" 
ON compromissos 
FOR ALL 
USING (empresa_id = (auth.jwt() ->> 'empresa_id')::uuid); 