CREATE TABLE fornecedores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cnpj VARCHAR(20),
  telefone VARCHAR(20),
  email VARCHAR(100),
  observacoes TEXT,
  user_id UUID, -- NULL = global, preenchido = privado
  tipo VARCHAR(30),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 