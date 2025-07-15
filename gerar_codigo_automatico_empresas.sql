-- =====================================================
-- GERAÇÃO AUTOMÁTICA DE CÓDIGOS DE AGÊNCIA
-- =====================================================
-- Sistema: CRM Turismo
-- Objetivo: Gerar automaticamente códigos únicos de 9 dígitos
-- =====================================================

-- 1. Verificar estrutura atual da tabela empresas
SELECT 'ESTRUTURA ATUAL:' as info;
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'empresas' 
ORDER BY ordinal_position;

-- 2. Criar função para gerar código aleatório de 9 dígitos
CREATE OR REPLACE FUNCTION gerar_codigo_agencia_automatico()
RETURNS TEXT AS $$
DECLARE
    codigo TEXT := '';
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    i INTEGER;
BEGIN
    -- Gerar código de 9 caracteres aleatórios
    FOR i IN 1..9 LOOP
        codigo := codigo || substr(chars, 1 + floor(random() * length(chars))::INTEGER, 1);
    END LOOP;
    RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar função para gerar código único (verificando duplicatas)
CREATE OR REPLACE FUNCTION gerar_codigo_agencia_unico()
RETURNS TEXT AS $$
DECLARE
    codigo TEXT;
    tentativas INTEGER := 0;
    max_tentativas INTEGER := 50;
BEGIN
    LOOP
        codigo := gerar_codigo_agencia_automatico();
        tentativas := tentativas + 1;
        
        -- Verificar se já existe
        IF NOT EXISTS (SELECT 1 FROM empresas WHERE codigo_agencia = codigo) THEN
            RETURN codigo;
        END IF;
        
        -- Evitar loop infinito
        IF tentativas >= max_tentativas THEN
            RAISE EXCEPTION 'Não foi possível gerar código único após % tentativas', max_tentativas;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger function para gerar código automaticamente
CREATE OR REPLACE FUNCTION trigger_gerar_codigo_agencia()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o código de agência não foi fornecido ou está vazio, gerar automaticamente
    IF NEW.codigo_agencia IS NULL OR NEW.codigo_agencia = '' THEN
        NEW.codigo_agencia := gerar_codigo_agencia_unico();
    END IF;
    
    -- Definir valores padrão para campos opcionais se não fornecidos
    IF NEW.ativo IS NULL THEN
        NEW.ativo := true;
    END IF;
    
    IF NEW.cnpj IS NULL THEN
        NEW.cnpj := '';
    END IF;
    
    IF NEW.logotipo IS NULL THEN
        NEW.logotipo := '';
    END IF;
    
    IF NEW.slug IS NULL THEN
        NEW.slug := '';
    END IF;
    
    IF NEW.cor_personalizada IS NULL THEN
        NEW.cor_personalizada := '#0caf99';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para executar antes da inserção
DROP TRIGGER IF EXISTS trigger_gerar_codigo_agencia_insert ON empresas;
CREATE TRIGGER trigger_gerar_codigo_agencia_insert
    BEFORE INSERT ON empresas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_gerar_codigo_agencia();

-- 6. Atualizar estrutura da tabela para tornar campos opcionais
ALTER TABLE empresas 
ALTER COLUMN cnpj DROP NOT NULL,
ALTER COLUMN codigo_agencia DROP NOT NULL,
ALTER COLUMN ativo SET DEFAULT true,
ALTER COLUMN cnpj SET DEFAULT '',
ALTER COLUMN logotipo SET DEFAULT '',
ALTER COLUMN slug SET DEFAULT '',
ALTER COLUMN cor_personalizada SET DEFAULT '#0caf99';

-- 7. Verificar se há empresas sem código e gerar para elas
UPDATE empresas 
SET codigo_agencia = gerar_codigo_agencia_unico()
WHERE codigo_agencia IS NULL OR codigo_agencia = '';

-- 8. Verificar resultado final
SELECT 'ESTRUTURA FINAL:' as info;
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'empresas' 
ORDER BY ordinal_position;

SELECT 'DADOS ATUAIS:' as info;
SELECT 
    id,
    nome,
    codigo_agencia,
    cnpj,
    ativo,
    created_at
FROM empresas 
ORDER BY created_at;

-- 9. Teste: Inserir uma empresa apenas com nome
INSERT INTO empresas (nome) 
VALUES ('Empresa Teste Automático')
RETURNING id, nome, codigo_agencia, cnpj, ativo;

-- 10. Verificar se o código foi gerado automaticamente
SELECT 'TESTE DE GERAÇÃO AUTOMÁTICA:' as info;
SELECT 
    id,
    nome,
    codigo_agencia,
    length(codigo_agencia) as tamanho_codigo,
    cnpj,
    ativo
FROM empresas 
WHERE nome = 'Empresa Teste Automático';

-- =====================================================
-- INSTRUÇÕES DE USO:
-- =====================================================
-- 
-- Agora você pode inserir empresas de forma simples:
-- 
-- 1. Apenas com nome (recomendado):
-- INSERT INTO empresas (nome) VALUES ('Nome da Empresa');
-- 
-- 2. Com nome e CNPJ:
-- INSERT INTO empresas (nome, cnpj) VALUES ('Nome da Empresa', '00.000.000/0001-00');
-- 
-- 3. Com todos os dados (código será gerado se não fornecido):
-- INSERT INTO empresas (nome, cnpj, ativo) VALUES ('Nome da Empresa', '00.000.000/0001-00', true);
-- 
-- O sistema irá:
-- ✅ Gerar automaticamente um código único de 9 dígitos
-- ✅ Definir ativo = true por padrão
-- ✅ Definir cnpj = '' se não fornecido
-- ✅ Definir cor_personalizada = '#0caf99' por padrão
-- 
-- ===================================================== 