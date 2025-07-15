CREATE TABLE categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('CUSTO', 'VENDA')),
  descricao TEXT,
  user_id UUID, -- NULL = global, preenchido = privada
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 