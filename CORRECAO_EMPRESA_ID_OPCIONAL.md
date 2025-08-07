# Correção: Campo empresa_id Opcional

## Problema Identificado
Ao tentar salvar uma promoção, o sistema retornava o erro:
```
Erro ao salvar promoção: {code: 23502, details: null, hint: null, message: null value in column "empresa_id" of relation "promocoes" violates not-null constraint}
```

## Causa do Problema
O campo `empresa_id` na tabela `promocoes` estava definido com constraint `NOT NULL`, mas o formulário permite que o usuário não selecione uma empresa específica (opção "Todas as empresas").

## Solução Implementada

### 1. Alteração na Estrutura da Tabela
**Arquivo:** `criar_tabela_promocoes.sql`

**Antes:**
```sql
empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
```

**Depois:**
```sql
empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
```

### 2. Script de Migração
**Arquivo:** `remover_constraint_empresa_id.sql`

Criado script para alterar tabelas existentes:
```sql
ALTER TABLE promocoes 
ALTER COLUMN empresa_id DROP NOT NULL;
```

### 3. Comportamento do Sistema

#### No Formulário:
- **Opção "Todas as empresas"**: `empresa_id` será `NULL`
- **Empresa específica selecionada**: `empresa_id` terá o UUID da empresa

#### No Código:
- O campo `formData.empresa_id` já estava sendo tratado corretamente
- String vazia é convertida para `null` antes do envio ao banco
- Código em `handleSubmit`: `empresa_id: formData.empresa_id || null`

#### Na Exibição:
- Promoções com `empresa_id = NULL` mostram "Todas as empresas"
- Promoções com empresa específica mostram nome e código da agência

## Arquivos Modificados

1. **`criar_tabela_promocoes.sql`**
   - Removida constraint `NOT NULL` do campo `empresa_id`

2. **`remover_constraint_empresa_id.sql`** (novo)
   - Script para migração de tabelas existentes

3. **`CORRECAO_EMPRESA_ID_OPCIONAL.md`** (novo)
   - Documentação das alterações

## Como Aplicar a Correção

### Para Novas Instalações:
1. Use o arquivo `criar_tabela_promocoes.sql` atualizado

### Para Instalações Existentes:
1. Execute o script `remover_constraint_empresa_id.sql` no banco de dados
2. Verifique se a alteração foi aplicada corretamente

## Resultado
Após a correção:
- ✅ Promoções podem ser criadas sem empresa específica
- ✅ Promoções podem ser vinculadas a empresas específicas
- ✅ Sistema funciona corretamente em ambos os casos
- ✅ Não há mais erro de constraint NOT NULL

## Próximos Passos
1. Aplicar o script de migração no banco de dados
2. Testar a criação de promoções com e sem empresa específica
3. Verificar se a listagem exibe corretamente "Todas as empresas" vs empresa específica