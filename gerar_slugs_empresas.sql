-- Adicionar campo slug para URLs amigáveis
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;

-- Função para gerar slug a partir do nome
CREATE OR REPLACE FUNCTION gerar_slug(nome_empresa TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(nome_empresa, '[áàâäã]', 'a', 'gi'),
        '[éèêë]', 'e', 'gi'
      ), 
      '[^a-z0-9]+', '-', 'gi'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Gerar slugs para empresas existentes
UPDATE empresas 
SET slug = gerar_slug(nome) 
WHERE slug IS NULL;

-- Exemplos de slugs gerados:
-- "7C Turismo & Consultoria" -> "7c-turismo-consultoria"
-- "Viagens & Cia" -> "viagens-cia"
-- "Turismo Total" -> "turismo-total"

-- Trigger para gerar slug automaticamente em novos registros
CREATE OR REPLACE FUNCTION trigger_gerar_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := gerar_slug(NEW.nome);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER empresas_gerar_slug
  BEFORE INSERT OR UPDATE ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_gerar_slug();

-- Criar índice para busca por slug
CREATE INDEX IF NOT EXISTS idx_empresas_slug ON empresas(slug);

-- Mostrar empresas com seus slugs
SELECT nome, slug, 
       'http://localhost:5174/orcamento/' || slug as url_completa
FROM empresas 
WHERE ativo = true; 