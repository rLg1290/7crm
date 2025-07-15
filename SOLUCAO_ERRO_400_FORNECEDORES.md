# Solução para Erro 400 ao Buscar Fornecedores

## 🔍 Problema Identificado

O erro 400 está ocorrendo porque:
1. O campo `empresa_id` não existe na tabela `fornecedores`
2. O service está tentando usar `empresa_id=is.null` mas o campo não existe
3. O `user?.empresa_id` está `undefined`

## 🛠️ Solução

### 1. Execute o Script SQL

Execute o script `verificar_e_adicionar_empresa_id.sql` no Supabase SQL Editor.

Este script irá:
- Verificar se o campo `empresa_id` existe
- Adicionar o campo se não existir
- Mostrar a estrutura final da tabela
- Exibir os dados existentes

### 2. Service Corrigido

O service já foi corrigido para:
- Não falhar se o campo `empresa_id` não existir
- Buscar apenas fornecedores globais e do usuário por enquanto
- Adicionar tratamento de erro para a busca de fornecedores da empresa

### 3. Teste no Frontend

Após executar o script SQL:

1. **Recarregue a página** do frontend
2. **Acesse a página Financeiro**
3. **Clique em "Nova Conta a Pagar"**
4. **Verifique o campo "Fornecedor"** - deve mostrar fornecedores sem erro

### 4. Logs Esperados

Após a correção, você deve ver nos logs:
```
Buscando fornecedores para usuário: [userId] empresa: [empresaId]
Resumo dos fornecedores encontrados:
- Globais: X
- Próprios do usuário: Y
- Da empresa: Z
```

### 5. Próximos Passos

1. Execute o script SQL
2. Teste no frontend
3. Se ainda houver problemas, execute o script de inserção de dados de teste
4. Verifique se os fornecedores aparecem no modal

## Comandos de Verificação

```sql
-- Verificar se o campo existe
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

Após executar o script:
- ✅ Campo `empresa_id` adicionado à tabela
- ✅ Erro 400 resolvido
- ✅ Fornecedores aparecem no modal
- ✅ Sistema funcionando normalmente 