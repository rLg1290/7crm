ALTER TABLE contas_pagar ALTER COLUMN pago_em TYPE DATE USING pago_em::DATE;
ALTER TABLE contas_receber ALTER COLUMN recebido_em TYPE DATE USING recebido_em::DATE;
