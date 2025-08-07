-- Script para atualizar a estrutura da tabela promocoes
-- para compatibilizar com o código da aplicação admin

-- Adicionar campos que estão faltando
ALTER TABLE promocoes ADD COLUMN IF NOT EXISTS titulo VARCHAR(255);
ALTER TABLE promocoes ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE promocoes ADD COLUMN IF NOT EXISTS imagem_url TEXT;
ALTER TABLE promocoes ADD COLUMN IF NOT EXISTS data_inicio DATE;
ALTER TABLE promocoes ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Atualizar dados existentes (se houver)
-- Migrar 'destino' para 'titulo'
UPDATE promocoes SET titulo = destino WHERE titulo IS NULL;

-- Migrar 'observacoes' para 'descricao'
UPDATE promocoes SET descricao = observacoes WHERE descricao IS NULL;

-- Comentários dos novos campos
COMMENT ON COLUMN promocoes.titulo IS 'Título da promoção';
COMMENT ON COLUMN promocoes.descricao IS 'Descrição detalhada da promoção';
COMMENT ON COLUMN promocoes.imagem_url IS 'URL da imagem da promoção';
COMMENT ON COLUMN promocoes.data_inicio IS 'Data de início da promoção';
COMMENT ON COLUMN promocoes.data_fim IS 'Data de fim da promoção';

-- Verificar a estrutura atualizada
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'promocoes'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_promocoes FROM promocoes;

-- Mostrar exemplo dos dados
SELECT 
    id,
    titulo,
    descricao,
    destino,
    valor_de,
    valor_por,
    tipo,
    ativo,
    created_at
FROM promocoes 
LIMIT 3;