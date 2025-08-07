-- Script para remover a constraint NOT NULL do campo empresa_id na tabela promocoes
-- Isso permite que promoções sejam criadas sem estar vinculadas a uma empresa específica

-- Alterar a coluna empresa_id para permitir valores NULL
ALTER TABLE promocoes 
ALTER COLUMN empresa_id DROP NOT NULL;

-- Atualizar o comentário da coluna para refletir a mudança
COMMENT ON COLUMN promocoes.empresa_id IS 'ID da empresa proprietária da promoção (opcional - NULL significa que a promoção é válida para todas as empresas)';

-- Verificar se a alteração foi aplicada corretamente
SELECT 
    column_name,
    is_nullable,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'promocoes' 
AND column_name = 'empresa_id';

-- Exemplo de teste: inserir uma promoção sem empresa_id
-- INSERT INTO promocoes (destino, valor_de, valor_por, tipo, observacoes) 
-- VALUES ('Teste Destino', 1000.00, 800.00, 'Pacote', 'Promoção de teste sem empresa específica');