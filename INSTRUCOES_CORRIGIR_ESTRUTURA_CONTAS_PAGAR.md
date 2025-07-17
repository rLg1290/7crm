# Instruções para Corrigir Estrutura da Tabela contas_pagar

## Problema Identificado
O erro indica que a coluna `categoria` não existe na tabela `contas_pagar`:
```
"Could not find the 'categoria' column of 'contas_pagar' in the schema cache"
```

## Solução

### 1. Execute o Script SQL
Abra o Supabase Dashboard e vá para o SQL Editor. Execute o script `verificar_estrutura_contas_pagar.sql` que foi criado.

Este script irá:
- Verificar se a tabela `contas_pagar` existe
- Mostrar a estrutura atual da tabela
- Criar a tabela com a estrutura correta se não existir
- Adicionar campos faltantes:
  - `categoria` (VARCHAR(100) NOT NULL)
  - `fornecedor_id` (INTEGER)
  - `forma_pagamento` (VARCHAR(100) NOT NULL)
  - `parcelas` (VARCHAR(10) NOT NULL)
  - `origem` (VARCHAR(50) DEFAULT 'MANUAL')
  - `origem_id` (VARCHAR(255))
  - `user_id` (UUID NOT NULL)
  - `pago_em` (DATE)
  - `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- Configurar RLS (Row Level Security)
- Criar políticas de acesso

### 2. Passos para Execução

#### Passo 1: Acessar Supabase
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Cole o conteúdo do arquivo `verificar_estrutura_contas_pagar.sql`
4. Execute o script

#### Passo 2: Verificar Resultados
Após executar o script, verifique na aba "Results":

1. **Tabela existe**: Deve mostrar `true`
2. **Estrutura da tabela**: Deve mostrar todas as colunas necessárias
3. **Total de contas**: Mostra quantas contas existem
4. **Políticas RLS**: Deve mostrar 4 políticas criadas

### 3. Estrutura Esperada da Tabela

Após executar o script, a tabela `contas_pagar` deve ter:

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `id` | SERIAL | ID único | ✅ |
| `categoria` | VARCHAR(100) | Nome da categoria | ✅ |
| `fornecedor_id` | INTEGER | ID do fornecedor | ❌ |
| `forma_pagamento` | VARCHAR(100) | Forma de pagamento | ✅ |
| `valor` | DECIMAL(10,2) | Valor da conta | ✅ |
| `parcelas` | VARCHAR(10) | Número de parcelas | ✅ |
| `vencimento` | DATE | Data de vencimento | ✅ |
| `status` | VARCHAR(20) | Status da conta | ❌ |
| `observacoes` | TEXT | Observações | ❌ |
| `origem` | VARCHAR(50) | Origem da conta | ❌ |
| `origem_id` | VARCHAR(255) | ID da origem | ❌ |
| `user_id` | UUID | ID do usuário | ✅ |
| `pago_em` | DATE | Data do pagamento | ❌ |
| `created_at` | TIMESTAMP | Data de criação | ❌ |

### 4. Teste a Funcionalidade

Após executar o script:

1. **Recarregue a página** do Financeiro no navegador
2. **Tente criar uma nova conta a pagar**:
   - Categoria: "Tarifa NET"
   - Fornecedor: Selecione um fornecedor
   - Forma de Pagamento: "Pix"
   - Valor: 500
   - Parcelas: 1
   - Vencimento: Selecione uma data
3. **Clique em "Salvar"**

### 5. Logs Esperados

No console do navegador, você deve ver:

```
✅ Antes da correção:
Financeiro.tsx:401 Iniciando salvamento de conta a pagar: {categoria: 'Tarifa NET', ...}
financeiroService.ts:257 Criando conta a pagar: {userId: '...', conta: {...}}
POST https://.../rest/v1/contas_pagar?select=* 400 (Bad Request)
"Could not find the 'categoria' column of 'contas_pagar' in the schema cache"

✅ Após a correção:
Financeiro.tsx:401 Iniciando salvamento de conta a pagar: {categoria: 'Tarifa NET', ...}
financeiroService.ts:257 Criando conta a pagar: {userId: '...', conta: {...}}
POST https://.../rest/v1/contas_pagar?select=* 201 (Created)
financeiroService.ts:271 Conta a pagar criada com sucesso: {...}
```

### 6. Verificação no Supabase

Após salvar com sucesso, verifique no Supabase Dashboard:

1. Vá para Table Editor
2. Selecione a tabela `contas_pagar`
3. Verifique se o novo registro foi criado com todos os campos

### 7. Possíveis Problemas

#### Problema: Erro 400 persiste
**Solução**: 
1. Verifique se o script foi executado completamente
2. Recarregue a página do navegador
3. Limpe o cache do navegador (Ctrl+F5)

#### Problema: Erro de RLS (403 Forbidden)
**Solução**: 
1. Verifique se as políticas RLS foram criadas
2. Confirme que o usuário está autenticado
3. Verifique se o `user_id` está sendo enviado corretamente

#### Problema: Campos não aparecem
**Solução**: 
1. Verifique a estrutura da tabela no Supabase
2. Confirme que todos os campos foram adicionados
3. Execute novamente o script se necessário

### 8. Comandos de Verificação

Execute estes comandos no SQL Editor para verificar:

```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contas_pagar'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'contas_pagar';

-- Verificar dados existentes
SELECT COUNT(*) as total_contas FROM contas_pagar;
```

### 9. Próximos Passos

Após corrigir a estrutura:

1. **Teste todas as funcionalidades**:
   - Criar conta a pagar
   - Editar conta existente
   - Marcar como paga
   - Deletar conta
   - Filtrar contas

2. **Verifique outras tabelas** se necessário:
   - `fornecedores`
   - `categorias_custo`
   - `formas_pagamento`

3. **Monitore logs** para garantir que não há mais erros

---

**Status**: ✅ Script criado e pronto para execução
**Prioridade**: 🔴 ALTA - Necessário para funcionamento das contas a pagar 