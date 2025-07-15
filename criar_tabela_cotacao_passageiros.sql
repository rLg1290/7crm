-- Criar tabela de relacionamento entre cotações e passageiros (clientes)
CREATE TABLE IF NOT EXISTS cotacao_passageiros (
  id BIGSERIAL PRIMARY KEY,
  cotacao_id BIGINT REFERENCES cotacoes(id) ON DELETE CASCADE,
  cliente_id BIGINT REFERENCES clientes(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL DEFAULT 'adulto', -- 'adulto', 'crianca', 'bebe'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que um cliente não seja duplicado na mesma cotação
  UNIQUE(cotacao_id, cliente_id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE cotacao_passageiros ENABLE ROW LEVEL SECURITY;

-- Políticas para cotacao_passageiros
CREATE POLICY "Usuários autenticados podem ler cotacao_passageiros" ON cotacao_passageiros
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir cotacao_passageiros" ON cotacao_passageiros
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar cotacao_passageiros" ON cotacao_passageiros
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar cotacao_passageiros" ON cotacao_passageiros
  FOR DELETE USING (auth.role() = 'authenticated');

-- Índices para melhor performance
CREATE INDEX idx_cotacao_passageiros_cotacao_id ON cotacao_passageiros(cotacao_id);
CREATE INDEX idx_cotacao_passageiros_cliente_id ON cotacao_passageiros(cliente_id); 