-- Create financeiro_emissoes table for internal financial control
CREATE TABLE IF NOT EXISTS financeiro_emissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cotacao_id BIGINT REFERENCES cotacoes(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES empresas(id),
    custo_milhas_total NUMERIC DEFAULT 0,
    tarifa_net_total NUMERIC DEFAULT 0,
    valor_concorrente_total NUMERIC DEFAULT 0,
    lucro_estimado NUMERIC DEFAULT 0,
    economia_gerada NUMERIC DEFAULT 0,
    milhas_utilizadas NUMERIC DEFAULT 0,
    data_emissao TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financeiro_emissoes_cotacao ON financeiro_emissoes(cotacao_id);
CREATE INDEX IF NOT EXISTS idx_financeiro_emissoes_empresa ON financeiro_emissoes(empresa_id);

-- Add comments for clarity
COMMENT ON TABLE financeiro_emissoes IS 'Tabela para controle financeiro interno de emissões (Consolidadora)';
COMMENT ON COLUMN financeiro_emissoes.custo_milhas_total IS 'Custo total em reais das milhas utilizadas';
COMMENT ON COLUMN financeiro_emissoes.tarifa_net_total IS 'Tarifa NET total (Custo real pago)';
COMMENT ON COLUMN financeiro_emissoes.valor_concorrente_total IS 'Valor que seria pago no concorrente/site';
COMMENT ON COLUMN financeiro_emissoes.lucro_estimado IS 'Lucro estimado (Tarifa NET - Custo Milhas)';
COMMENT ON COLUMN financeiro_emissoes.economia_gerada IS 'Economia gerada para a agência (Concorrente - Tarifa NET)';
