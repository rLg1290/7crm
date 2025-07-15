-- Adicionar campo empresa_id à tabela cotações
-- Este campo conectará cada cotação à empresa responsável

-- 1. Primeiro, adicionar usuario_id se não existir (para compatibilidade)
ALTER TABLE cotacoes 
ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES auth.users(id);

-- 2. Adicionar coluna empresa_id
ALTER TABLE cotacoes 
ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id);

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cotacoes_usuario_id ON cotacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cotacoes_empresa_id ON cotacoes(empresa_id);

-- 4. Atualizar cotações existentes com empresa_id baseado no usuario_id
-- (somente se usuario_id existir e tiver dados)
UPDATE cotacoes 
SET empresa_id = (
  SELECT (auth.users.raw_user_meta_data ->> 'empresa_id')::uuid 
  FROM auth.users 
  WHERE auth.users.id = cotacoes.usuario_id
)
WHERE empresa_id IS NULL 
  AND usuario_id IS NOT NULL 
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = cotacoes.usuario_id);

-- 5. Para cotações sem usuario_id ou empresa_id, usar a primeira empresa disponível (fallback)
UPDATE cotacoes 
SET empresa_id = (
  SELECT id 
  FROM empresas 
  LIMIT 1
)
WHERE empresa_id IS NULL;

-- 6. Política RLS para restringir acesso por empresa (opcional)
-- CREATE POLICY "Cotações por empresa" ON cotacoes
--   FOR ALL USING (
--     empresa_id = (auth.jwt() ->> 'empresa_id')::uuid 
--     OR auth.role() = 'service_role'
--   );

-- 7. Criar trigger para definir empresa_id automaticamente em novas cotações
CREATE OR REPLACE FUNCTION set_cotacao_empresa_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Se empresa_id não foi fornecido, buscar do usuário
  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := (
      SELECT (auth.users.raw_user_meta_data ->> 'empresa_id')::uuid 
      FROM auth.users 
      WHERE auth.users.id = NEW.usuario_id
    );
    
    -- Se ainda não tiver empresa_id, usar a primeira empresa disponível
    IF NEW.empresa_id IS NULL THEN
      NEW.empresa_id := (
        SELECT id 
        FROM empresas 
        LIMIT 1
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Aplicar trigger
DROP TRIGGER IF EXISTS trigger_set_cotacao_empresa_id ON cotacoes;
CREATE TRIGGER trigger_set_cotacao_empresa_id
  BEFORE INSERT ON cotacoes
  FOR EACH ROW
  EXECUTE FUNCTION set_cotacao_empresa_id();

-- 9. Verificar resultado
SELECT 
  c.id,
  c.titulo,
  c.usuario_id,
  c.empresa_id,
  e.nome as empresa_nome
FROM cotacoes c
LEFT JOIN empresas e ON e.id = c.empresa_id
ORDER BY c.id DESC
LIMIT 5; 