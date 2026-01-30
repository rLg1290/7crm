-- Add payment method configuration columns to empresas table
ALTER TABLE public.empresas 
ADD COLUMN IF NOT EXISTS pagamento_pix boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pagamento_cartao boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS pagamento_boleto boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS pagamento_faturado boolean DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN public.empresas.pagamento_pix IS 'Habilita pagamento via PIX';
COMMENT ON COLUMN public.empresas.pagamento_cartao IS 'Habilita pagamento via Cartão de Crédito';
COMMENT ON COLUMN public.empresas.pagamento_boleto IS 'Habilita pagamento via Boleto Bancário';
COMMENT ON COLUMN public.empresas.pagamento_faturado IS 'Habilita pagamento Faturado';
