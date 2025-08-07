-- Script para criar a tabela de promoções
-- Esta tabela irá alimentar o sistema de promoções da aplicação

CREATE TABLE promocoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    destino VARCHAR(255) NOT NULL,
    valor_de DECIMAL(10,2) NOT NULL,
    valor_por DECIMAL(10,2) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários dos campos
COMMENT ON TABLE promocoes IS 'Tabela para armazenar as promoções das empresas';
COMMENT ON COLUMN promocoes.id IS 'Identificador único da promoção';
COMMENT ON COLUMN promocoes.empresa_id IS 'ID da empresa proprietária da promoção';
COMMENT ON COLUMN promocoes.destino IS 'Destino da promoção (ex: Paris, Rio de Janeiro, etc.)';
COMMENT ON COLUMN promocoes.valor_de IS 'Valor original (preço "de")';
COMMENT ON COLUMN promocoes.valor_por IS 'Valor promocional (preço "por")';
COMMENT ON COLUMN promocoes.tipo IS 'Tipo da promoção (ex: Pacote, Aéreo, Hotel, etc.)';
COMMENT ON COLUMN promocoes.observacoes IS 'Observações adicionais sobre a promoção';
COMMENT ON COLUMN promocoes.ativo IS 'Indica se a promoção está ativa';
COMMENT ON COLUMN promocoes.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN promocoes.updated_at IS 'Data da última atualização do registro';

-- Índices para melhorar performance
CREATE INDEX idx_promocoes_empresa_id ON promocoes(empresa_id);
CREATE INDEX idx_promocoes_ativo ON promocoes(ativo);
CREATE INDEX idx_promocoes_tipo ON promocoes(tipo);
CREATE INDEX idx_promocoes_destino ON promocoes(destino);

-- Trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_promocoes_updated_at
    BEFORE UPDATE ON promocoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) para garantir que cada empresa veja apenas suas promoções
ALTER TABLE promocoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas podem ver apenas suas próprias promoções" ON promocoes
    FOR ALL USING (empresa_id = auth.uid());

-- Inserir alguns dados de exemplo (opcional)
-- INSERT INTO promocoes (empresa_id, destino, valor_de, valor_por, tipo, observacoes) VALUES
-- Substitua 'sua-empresa-id' pelo ID real da empresa
-- ('sua-empresa-id', 'Paris', 2500.00, 1999.00, 'Pacote', 'Pacote completo com hotel e passagem'),
-- ('sua-empresa-id', 'Rio de Janeiro', 800.00, 599.00, 'Aéreo', 'Passagem aérea ida e volta'),
-- ('sua-empresa-id', 'Cancún', 3200.00, 2499.00, 'Resort', 'All inclusive por 7 dias');

-- Verificar se a tabela foi criada corretamente
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'promocoes'
ORDER BY ordinal_position;