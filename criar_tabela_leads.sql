-- Criar tabela leads
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  cliente_id BIGINT REFERENCES clientes(id) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar RLS (Row Level Security) se necessário
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso total (ajuste conforme suas necessidades de segurança)
CREATE POLICY "Permitir acesso total aos leads" ON leads
  FOR ALL USING (true);

-- Inserir alguns dados de exemplo (opcional)
INSERT INTO leads (cliente_id, observacao) VALUES
  ((SELECT id FROM clientes LIMIT 1), 'Interessado em viagem para Europa em julho'),
  ((SELECT id FROM clientes LIMIT 1 OFFSET 1), 'Quer conhecer Nova York no final do ano'); 