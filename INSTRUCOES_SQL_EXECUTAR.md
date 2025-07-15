# Instruções para Executar SQL - Campos empresa_id e usuario_id

## 📋 SQL para Executar no Supabase

Para que a página de impressão exiba corretamente os dados da empresa, execute o seguinte SQL no **Supabase SQL Editor**:

```sql
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

-- 6. Criar trigger para definir empresa_id automaticamente em novas cotações
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

-- 7. Aplicar trigger
DROP TRIGGER IF EXISTS trigger_set_cotacao_empresa_id ON cotacoes;
CREATE TRIGGER trigger_set_cotacao_empresa_id
  BEFORE INSERT ON cotacoes
  FOR EACH ROW 
  EXECUTE FUNCTION set_cotacao_empresa_id();

-- 8. Verificar resultado
SELECT 
  c.id, 
  c.titulo, 
  c.usuario_id, 
  c.empresa_id, 
  e.nome as empresa_nome,
  e.cnpj as empresa_cnpj,
  e.cor_personalizada
FROM cotacoes c
LEFT JOIN empresas e ON e.id = c.empresa_id
ORDER BY c.data_criacao DESC
LIMIT 10;
```

## ✅ O que Este SQL Faz

1. **Adiciona campos necessários**: `usuario_id` e `empresa_id` na tabela `cotacoes`
2. **Cria índices**: Para melhor performance nas consultas
3. **Migra dados existentes**: Conecta cotações antigas às empresas corretas
4. **Cria trigger automático**: Novas cotações terão `empresa_id` automaticamente
5. **Verifica resultado**: Mostra se os dados foram conectados corretamente

## 🎯 Resultado Esperado

Após executar o SQL, a página de impressão deverá exibir:
- **Nome correto da empresa** (da tabela `empresas`)
- **CNPJ correto** (da tabela `empresas`) 
- **Cor personalizada** (do campo `cor_personalizada` da empresa)
- **Logo da empresa** (se configurado)

## 🔍 Como Verificar

1. Execute o SQL no Supabase
2. Acesse uma cotação existente
3. Clique no botão "Imprimir" 
4. Verifique se os dados da empresa aparecem corretamente no cabeçalho

## ⚠️ Importante

- Execute este SQL **apenas uma vez**
- Faça backup dos dados antes de executar
- Se houver erro, verifique se a tabela `empresas` existe e tem dados 