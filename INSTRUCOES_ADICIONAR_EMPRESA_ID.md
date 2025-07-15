# Instruções para Adicionar Campo empresa_id

## Problema
Você quer adicionar apenas o campo `empresa_id` à tabela `fornecedores` existente.

## Solução

### 1. Execute o Script SQL

Execute o script `adicionar_apenas_empresa_id_fornecedores.sql` no Supabase SQL Editor.

Este script irá:
- Verificar se a coluna `empresa_id` já existe
- Adicionar a coluna se não existir
- Mostrar a estrutura atual da tabela
- Exibir os dados existentes

### 2. O que o Script Faz

```sql
-- Adiciona apenas a coluna empresa_id (UUID) - pode ser nulo para fornecedores globais
ALTER TABLE fornecedores ADD COLUMN empresa_id UUID NULL;
```

### 3. Tipos de Fornecedores

Com o campo `empresa_id`, você pode ter:

- **Fornecedores Globais**: `empresa_id = NULL` (disponíveis para todos)
- **Fornecedores da Empresa**: `empresa_id = UUID da empresa` (disponíveis apenas para a empresa)
- **Fornecedores do Usuário**: `user_id = UUID do usuário` (disponíveis apenas para o usuário)

### 4. Verificação

Após executar o script, você verá:
- Se a coluna foi adicionada com sucesso
- A estrutura atual da tabela
- Os dados existentes

### 5. Próximos Passos

Após adicionar o campo `empresa_id`:

1. Teste no frontend acessando a página Financeiro
2. Verifique se os fornecedores aparecem normalmente
3. Teste adicionar um novo fornecedor
4. Se necessário, implemente a funcionalidade de fornecedores da empresa no código

### 6. Comando de Verificação Manual

Se quiser verificar manualmente:

```sql
-- Verificar se a coluna existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fornecedores' 
AND column_name = 'empresa_id';

-- Verificar estrutura completa
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position;
```

## Resultado Esperado

Após executar o script, a tabela `fornecedores` terá a coluna `empresa_id` adicionada e estará pronta para uso. 