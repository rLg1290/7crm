# Solução para Contas a Receber não serem Lançadas em Cotações

## Problema Identificado
As contas a receber não estão sendo lançadas quando o usuário clica em "Lançar Venda" no módulo de cotações. O erro 400 indica que há campos obrigatórios faltando na tabela `contas_receber`.

## Causa do Problema
1. **Campo `empresa_id` faltando**: A tabela `contas_receber` não tinha o campo `empresa_id` que é obrigatório para as políticas RLS
2. **Campos obrigatórios não preenchidos**: O código não estava enviando todos os campos necessários
3. **Estrutura inconsistente**: A tabela não tinha todos os campos esperados pelo código

## Solução Implementada

### 1. Script SQL para Corrigir Estrutura da Tabela
Execute o script `corrigir_contas_receber_cotacoes.sql` no Supabase SQL Editor:

```sql
-- Copie e cole o conteúdo do arquivo corrigir_contas_receber_cotacoes.sql
-- no Supabase SQL Editor e execute
```

Este script irá:
- Verificar se a tabela `contas_receber` existe
- Adicionar campos faltantes:
  - `empresa_id` (UUID) - Referência para empresas
  - `user_id` (UUID) - Referência para usuários
  - `categoria_id` (INTEGER) - ID da categoria
  - `forma_recebimento_id` (INTEGER) - ID da forma de recebimento
  - `parcelas` (VARCHAR(10)) - Número de parcelas
  - `origem` (VARCHAR(50)) - Origem da conta (COTACAO, MANUAL, etc.)
  - `origem_id` (VARCHAR(255)) - ID da origem
  - `created_at` (TIMESTAMP) - Data de criação
  - `updated_at` (TIMESTAMP) - Data de atualização
- Configurar RLS (Row Level Security)
- Criar políticas de acesso
- Criar índices para performance

### 2. Correção no Código Frontend
O arquivo `src/pages/Cotacoes.tsx` foi corrigido para incluir todos os campos obrigatórios:

```typescript
// Buscar empresa_id do usuário
const empresa_id = user?.user_metadata?.empresa_id || null;

// Buscar nome do cliente
const clienteNome = getNomeCompletoCliente(clienteIdToSave?.toString()) || 'Cliente não identificado';

await supabase.from('contas_receber').insert({
  descricao: item.descricao,
  valor: item.valor,
  cliente_id: clienteIdToSave,
  cliente_nome: clienteNome, // ← CAMPO OBRIGATÓRIO ADICIONADO
  servico: item.conta || 'Venda', // ← CAMPO OBRIGATÓRIO ADICIONADO
  categoria_id: item.categoria || null,
  forma_recebimento_id: getIdFormaPagamento(item.forma) || null,
  parcelas: item.parcelas,
  vencimento: item.vencimento,
  status: 'PENDENTE',
  origem: 'COTACAO',
  origem_id: editingCotacao?.id || null,
  user_id: user.id,
  empresa_id: empresa_id, // ← CAMPO OBRIGATÓRIO ADICIONADO
  created_at: dataCriacao
});
```

## Passos para Execução

### Passo 1: Executar Script SQL
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Cole o conteúdo do arquivo `corrigir_contas_receber_cotacoes.sql`
4. Execute o script
5. Verifique os resultados na aba "Results"

### Passo 2: Verificar Estrutura da Tabela
Após executar o script, verifique se a tabela tem todos os campos necessários:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contas_receber'
ORDER BY ordinal_position;
```

### Passo 3: Testar Funcionalidade
1. Acesse o módulo de Cotações
2. Crie uma cotação com itens de venda
3. Clique em "Lançar Venda"
4. Verifique se as contas a receber são criadas
5. Acesse o módulo Financeiro para confirmar

## Verificações no Console

Após a correção, verifique no console do navegador:

1. **Ao lançar venda**: Deve aparecer "cliente_id sendo salvo: [ID]"
2. **Se houver erro**: Será mostrado o erro específico do Supabase
3. **Sucesso**: Deve aparecer "Contas emitidas com sucesso!"

## Estrutura Esperada da Tabela

Após executar o script, a tabela `contas_receber` deve ter:

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `id` | UUID | ID único | ✅ |
| `empresa_id` | UUID | ID da empresa | ✅ |
| `cliente_id` | UUID | ID do cliente | ❌ |
| `cliente_nome` | VARCHAR(255) | Nome do cliente | ✅ |
| `descricao` | TEXT | Descrição da conta | ✅ |
| `servico` | VARCHAR(100) | Tipo de serviço | ✅ |
| `valor` | DECIMAL(10,2) | Valor da conta | ✅ |
| `vencimento` | DATE | Data de vencimento | ✅ |
| `status` | VARCHAR(20) | Status da conta | ✅ |
| `categoria_id` | INTEGER | ID da categoria | ❌ |
| `forma_recebimento_id` | INTEGER | ID da forma de recebimento | ❌ |
| `parcelas` | VARCHAR(10) | Número de parcelas | ❌ |
| `origem` | VARCHAR(50) | Origem da conta | ❌ |
| `origem_id` | VARCHAR(255) | ID da origem | ❌ |
| `user_id` | UUID | ID do usuário | ✅ |
| `created_at` | TIMESTAMP | Data de criação | ✅ |
| `updated_at` | TIMESTAMP | Data de atualização | ✅ |

## Troubleshooting

### Problema: Erro 400 persiste
**Solução:**
1. Verifique se o script SQL foi executado completamente
2. Verifique se o usuário tem `empresa_id` válido
3. Verifique os logs no console do navegador

### Problema: Contas não aparecem no Financeiro
**Solução:**
1. Verifique se as políticas RLS estão criadas
2. Verifique se o `empresa_id` está sendo enviado corretamente
3. Verifique se há dados na tabela `contas_receber`

### Problema: Erro de RLS
**Solução:**
1. Execute novamente o script SQL
2. Verifique se as políticas foram criadas corretamente
3. Verifique se o usuário tem acesso à empresa

## Status da Correção
- ✅ Script SQL criado
- ✅ Código frontend corrigido (todos os campos obrigatórios incluídos)
- ✅ Campos obrigatórios identificados e corrigidos:
  - `empresa_id` - ID da empresa do usuário
  - `cliente_nome` - Nome completo do cliente
  - `servico` - Tipo de serviço (conta ou 'Venda')
- ✅ **CORREÇÃO ADICIONAL**: Modal de venda corrigido:
  - ❌ Removido campo "Forma de Recebimento" (desnecessário)
  - ✅ Campo "Forma de Pagamento" agora salva o ID correto
  - ✅ Mapeamento correto dos campos:
    - Descrição = descricao
    - Valor = valor
    - Cliente = cliente_id
    - Categoria = categoria_id
    - Vencimento = vencimento
    - Forma de pagamento = forma_recebimento_id
    - Parcelas = parcelas
- ⏳ Aguardando execução do script SQL
- ⏳ Aguardando testes da funcionalidade 