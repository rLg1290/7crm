# Instruções para Adicionar Campo Código

## Problema
O erro "Could not find the 'codigo' column of 'cotacoes' in the schema cache" ocorre porque a tabela `cotacoes` no Supabase não possui o campo `codigo`.

## Solução

### 1. Acesse o Painel do Supabase
- Vá para [supabase.com](https://supabase.com)
- Faça login na sua conta
- Acesse o projeto do sistema de cotações

### 2. Execute o SQL
- No painel do Supabase, vá para **SQL Editor**
- Clique em **New Query**
- Cole o seguinte código SQL:

```sql
-- Adicionar campo codigo à tabela cotacoes existente
ALTER TABLE cotacoes 
ADD COLUMN IF NOT EXISTS codigo VARCHAR(6) UNIQUE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_cotacoes_codigo ON cotacoes(codigo);

-- Atualizar registros existentes com códigos únicos
UPDATE cotacoes 
SET codigo = CONCAT('COT', LPAD(id::text, 4, '0'))
WHERE codigo IS NULL;

-- Tornar o campo NOT NULL após preencher todos os registros
ALTER TABLE cotacoes 
ALTER COLUMN codigo SET NOT NULL;
```

### 3. Execute a Query
- Clique em **Run** para executar o SQL
- Aguarde a confirmação de sucesso

### 4. Verificação
- Vá para **Table Editor**
- Selecione a tabela `cotacoes`
- Verifique se o campo `codigo` foi adicionado
- Verifique se os registros existentes receberam códigos únicos

## O que o SQL faz:

1. **Adiciona o campo `codigo`** como VARCHAR(6) UNIQUE
2. **Cria um índice** para melhor performance nas consultas
3. **Atualiza registros existentes** com códigos no formato COT0001, COT0002, etc.
4. **Torna o campo obrigatório** (NOT NULL)

## Após executar o SQL:
- O sistema funcionará normalmente
- Novas cotações terão códigos únicos gerados automaticamente
- O erro será resolvido
- As cotações existentes terão códigos retroativos

## Fluxo Atualizado:
1. **Selecionar cliente** → Cria cotação automaticamente com código único
2. **Preencher formulário** → Atualiza a cotação existente
3. **Salvar** → Atualiza dados da cotação no banco 