-- Script para adicionar campo logo_url à tabela CiasAereas existente
-- Execute apenas se a tabela já foi criada sem a coluna logo_url

-- Adicionar coluna logo_url se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CiasAereas' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE "CiasAereas" ADD COLUMN logo_url TEXT;
    END IF;
END $$;

-- Atualizar exemplos existentes com URLs de logo placeholder
UPDATE "CiasAereas" 
SET logo_url = CASE nome
    WHEN 'LATAM' THEN 'https://via.placeholder.com/80x80/0066CC/FFFFFF?text=LA'
    WHEN 'GOL' THEN 'https://via.placeholder.com/80x80/FF6600/FFFFFF?text=GO'
    WHEN 'Azul' THEN 'https://via.placeholder.com/80x80/0066FF/FFFFFF?text=AZ'
    WHEN 'American Airlines' THEN 'https://via.placeholder.com/80x80/1E3A8A/FFFFFF?text=AA'
    WHEN 'Delta Air Lines' THEN 'https://via.placeholder.com/80x80/1E40AF/FFFFFF?text=DL'
    WHEN 'United Airlines' THEN 'https://via.placeholder.com/80x80/1E3A8A/FFFFFF?text=UA'
    WHEN 'TAP Portugal' THEN 'https://via.placeholder.com/80x80/DC2626/FFFFFF?text=TP'
    WHEN 'Copa Airlines' THEN 'https://via.placeholder.com/80x80/059669/FFFFFF?text=CM'
    WHEN 'Avianca' THEN 'https://via.placeholder.com/80x80/DC2626/FFFFFF?text=AV'
    WHEN 'Copa Airlines' THEN 'https://via.placeholder.com/80x80/059669/FFFFFF?text=CM'
    ELSE NULL
END
WHERE logo_url IS NULL AND nome IN ('LATAM', 'GOL', 'Azul', 'American Airlines', 'Delta Air Lines', 'United Airlines', 'TAP Portugal', 'Copa Airlines', 'Avianca');

-- Comentário sobre como adicionar logos reais
-- Para adicionar logos reais das companhias aéreas:
-- 1. Hospede as imagens em um serviço (Supabase Storage, Cloudinary, etc.)
-- 2. Obtenha as URLs públicas das imagens
-- 3. Execute:
-- UPDATE "CiasAereas" 
-- SET logo_url = 'https://sua-url-da-imagem.com/logo.png'
-- WHERE nome = 'NOME_DA_COMPANHIA'; 