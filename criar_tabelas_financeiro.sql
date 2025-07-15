-- Criação das tabelas para o módulo financeiro
-- Execute este script no Supabase SQL Editor

-- Tabela de transações financeiras
CREATE TABLE IF NOT EXISTS transacoes_financeiras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  descricao TEXT NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'vencido')),
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome VARCHAR(255),
  vencimento DATE,
  observacoes TEXT,
  comprovante_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contas a pagar
CREATE TABLE IF NOT EXISTS contas_pagar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  fornecedor VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('paga', 'pendente', 'vencida')),
  data_pagamento DATE,
  forma_pagamento VARCHAR(50),
  observacoes TEXT,
  comprovante_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contas a receber
CREATE TABLE IF NOT EXISTS contas_receber (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  servico VARCHAR(100) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('recebida', 'pendente', 'vencida')),
  data_recebimento DATE,
  forma_recebimento VARCHAR(50),
  observacoes TEXT,
  comprovante_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias financeiras
CREATE TABLE IF NOT EXISTS categorias_financeiras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  cor VARCHAR(7) DEFAULT '#3B82F6',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(empresa_id, nome, tipo)
);

-- Inserir categorias padrão
INSERT INTO categorias_financeiras (empresa_id, nome, tipo, cor) VALUES
-- Categorias de receita
(NULL, 'Vendas', 'receita', '#10B981'),
(NULL, 'Hospedagem', 'receita', '#3B82F6'),
(NULL, 'Transporte', 'receita', '#8B5CF6'),
(NULL, 'Seguros', 'receita', '#F59E0B'),
(NULL, 'Comissões', 'receita', '#EF4444'),
(NULL, 'Taxas', 'receita', '#6B7280'),
(NULL, 'Outros', 'receita', '#9CA3AF'),

-- Categorias de despesa
(NULL, 'Comissões', 'despesa', '#EF4444'),
(NULL, 'Marketing', 'despesa', '#8B5CF6'),
(NULL, 'Tecnologia', 'despesa', '#3B82F6'),
(NULL, 'Utilitários', 'despesa', '#10B981'),
(NULL, 'Aluguel', 'despesa', '#F59E0B'),
(NULL, 'Salários', 'despesa', '#6B7280'),
(NULL, 'Taxas', 'despesa', '#9CA3AF'),
(NULL, 'Software', 'despesa', '#6366F1'),
(NULL, 'Reembolsos', 'despesa', '#EC4899'),
(NULL, 'Outros', 'despesa', '#A3A3A3')
ON CONFLICT DO NOTHING;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_empresa_id ON transacoes_financeiras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes_financeiras(data);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes_financeiras(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON transacoes_financeiras(status);

CREATE INDEX IF NOT EXISTS idx_contas_pagar_empresa_id ON contas_pagar(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON contas_pagar(vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contas_pagar(status);

CREATE INDEX IF NOT EXISTS idx_contas_receber_empresa_id ON contas_receber(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contas_receber_vencimento ON contas_receber(vencimento);
CREATE INDEX IF NOT EXISTS idx_contas_receber_status ON contas_receber(status);

CREATE INDEX IF NOT EXISTS idx_categorias_empresa_id ON categorias_financeiras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_categorias_tipo ON categorias_financeiras(tipo);

-- Habilitar RLS (Row Level Security)
ALTER TABLE transacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_financeiras ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para transacoes_financeiras
CREATE POLICY "Usuários podem ver transações da sua empresa" ON transacoes_financeiras
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir transações na sua empresa" ON transacoes_financeiras
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar transações da sua empresa" ON transacoes_financeiras
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar transações da sua empresa" ON transacoes_financeiras
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

-- Políticas RLS para contas_pagar
CREATE POLICY "Usuários podem ver contas a pagar da sua empresa" ON contas_pagar
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir contas a pagar na sua empresa" ON contas_pagar
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar contas a pagar da sua empresa" ON contas_pagar
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar contas a pagar da sua empresa" ON contas_pagar
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

-- Políticas RLS para contas_receber
CREATE POLICY "Usuários podem ver contas a receber da sua empresa" ON contas_receber
  FOR SELECT USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir contas a receber na sua empresa" ON contas_receber
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar contas a receber da sua empresa" ON contas_receber
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar contas a receber da sua empresa" ON contas_receber
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

-- Políticas RLS para categorias_financeiras
CREATE POLICY "Usuários podem ver categorias da sua empresa" ON categorias_financeiras
  FOR SELECT USING (
    empresa_id IS NULL OR empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir categorias na sua empresa" ON categorias_financeiras
  FOR INSERT WITH CHECK (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar categorias da sua empresa" ON categorias_financeiras
  FOR UPDATE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar categorias da sua empresa" ON categorias_financeiras
  FOR DELETE USING (
    empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas 
      WHERE usuario_id = auth.uid()
    )
  );

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_transacoes_financeiras_updated_at 
  BEFORE UPDATE ON transacoes_financeiras 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contas_pagar_updated_at 
  BEFORE UPDATE ON contas_pagar 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contas_receber_updated_at 
  BEFORE UPDATE ON contas_receber 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categorias_financeiras_updated_at 
  BEFORE UPDATE ON categorias_financeiras 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular resumo financeiro
CREATE OR REPLACE FUNCTION calcular_resumo_financeiro(p_empresa_id UUID, p_mes INTEGER, p_ano INTEGER)
RETURNS TABLE (
  saldo_atual DECIMAL,
  receitas_mes DECIMAL,
  despesas_mes DECIMAL,
  lucro_mes DECIMAL,
  contas_pagar_total DECIMAL,
  contas_receber_total DECIMAL,
  fluxo_caixa_projetado DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH 
    receitas_mes AS (
      SELECT COALESCE(SUM(valor), 0) as total
      FROM transacoes_financeiras 
      WHERE empresa_id = p_empresa_id 
        AND tipo = 'receita' 
        AND EXTRACT(MONTH FROM data) = p_mes 
        AND EXTRACT(YEAR FROM data) = p_ano
        AND status = 'pago'
    ),
    despesas_mes AS (
      SELECT COALESCE(SUM(valor), 0) as total
      FROM transacoes_financeiras 
      WHERE empresa_id = p_empresa_id 
        AND tipo = 'despesa' 
        AND EXTRACT(MONTH FROM data) = p_mes 
        AND EXTRACT(YEAR FROM data) = p_ano
        AND status = 'pago'
    ),
    contas_pagar_total AS (
      SELECT COALESCE(SUM(valor), 0) as total
      FROM contas_pagar 
      WHERE empresa_id = p_empresa_id 
        AND status IN ('pendente', 'vencida')
    ),
    contas_receber_total AS (
      SELECT COALESCE(SUM(valor), 0) as total
      FROM contas_receber 
      WHERE empresa_id = p_empresa_id 
        AND status IN ('pendente', 'vencida')
    ),
    saldo_atual AS (
      SELECT 
        (SELECT total FROM receitas_mes) - (SELECT total FROM despesas_mes) as saldo
    )
  SELECT 
    (SELECT saldo FROM saldo_atual),
    (SELECT total FROM receitas_mes),
    (SELECT total FROM despesas_mes),
    (SELECT saldo FROM saldo_atual),
    (SELECT total FROM contas_pagar_total),
    (SELECT total FROM contas_receber_total),
    (SELECT saldo FROM saldo_atual) + (SELECT total FROM contas_receber_total) - (SELECT total FROM contas_pagar_total);
END;
$$ LANGUAGE plpgsql; 