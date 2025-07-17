# Instruções para Adicionar Campo categoria_id à Tabela contas_receber

## Problema
A tabela `contas_receber` não possui o campo `categoria_id` necessário para exibir os nomes das categorias em vez dos IDs na interface.

## Solução

### 1. Execute o Script SQL
Abra o Supabase Dashboard e vá para o SQL Editor. Execute o script `adicionar_campo_categoria_id_contas_receber.sql` que foi criado.

Este script irá:
- Verificar se o campo `categoria_id` já existe na tabela
- Adicionar o campo se não existir
- Mostrar a estrutura atual da tabela
- Verificar os dados existentes

### 2. Passos para Execução

#### Passo 1: Acessar Supabase
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Cole o conteúdo do arquivo `adicionar_campo_categoria_id_contas_receber.sql`
4. Execute o script

#### Passo 2: Verificar Resultados
Após executar o script, verifique na aba "Results":

1. **Campo existe**: Deve mostrar `true` se já existir, `false` se não existir
2. **Estrutura da tabela**: Deve mostrar todas as colunas incluindo `categoria_id`
3. **Total de registros**: Mostra quantas contas a receber existem
4. **Dados de exemplo**: Mostra alguns registros para verificar

### 3. Estrutura Esperada da Tabela

Após executar o script, a tabela `contas_receber` deve ter:

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `id` | UUID | ID único | ✅ |
| `empresa_id` | UUID | Referência à empresa | ✅ |
| `cliente_id` | UUID | Referência ao cliente | ❌ |
| `cliente_nome` | VARCHAR(255) | Nome do cliente | ✅ |
| `categoria_id` | INTEGER | **NOVO CAMPO** - ID da categoria | ❌ |
| `descricao` | TEXT | Descrição da conta | ✅ |
| `servico` | VARCHAR(100) | Tipo de serviço | ✅ |
| `valor` | DECIMAL(10,2) | Valor da conta | ✅ |
| `vencimento` | DATE | Data de vencimento | ✅ |
| `status` | VARCHAR(20) | Status da conta | ✅ |
| `data_recebimento` | DATE | Data do recebimento | ❌ |
| `forma_recebimento` | VARCHAR(50) | Forma de recebimento | ❌ |
| `observacoes` | TEXT | Observações | ❌ |
| `comprovante_url` | TEXT | URL do comprovante | ❌ |
| `created_at` | TIMESTAMP | Data de criação | ✅ |
| `updated_at` | TIMESTAMP | Data de atualização | ❌ |

### 4. Funcionalidades Implementadas

Após executar o script e recarregar a página, a tabela de contas a receber irá:

1. **Exibir nomes dos clientes** em vez de IDs
2. **Exibir nomes das categorias** em vez de IDs
3. **Manter a funcionalidade existente** de salvar e editar contas

### 5. Teste da Funcionalidade

#### 5.1 Recarregue a Página
- Recarregue a página do Financeiro no navegador

#### 5.2 Verifique a Tabela
1. Vá para a aba "Contas a Receber"
2. Verifique se os nomes dos clientes e categorias estão sendo exibidos corretamente
3. Se ainda aparecer "ID: X", significa que o registro não tem o campo preenchido

#### 5.3 Teste a Criação de Nova Conta
1. Clique em "Adicionar Cobrança"
2. Preencha os campos incluindo categoria
3. Salve a conta
4. Verifique se o nome da categoria aparece na tabela

### 6. Logs Esperados

Após a implementação, você deve ver no console:

```
✅ Carregando clientes para empresa: [ID]
✅ Clientes carregados: [quantidade]
✅ Carregando contas a receber para empresa: [ID]
✅ Contas a receber carregadas: [quantidade]
```

### 7. Verificação no Banco

Após salvar com sucesso, verifique no Supabase:

```sql
-- Verificar a conta criada
SELECT 
  cr.id,
  cr.cliente_nome,
  c.nome as nome_categoria,
  cr.descricao,
  cr.valor,
  cr.vencimento,
  cr.status
FROM contas_receber cr
LEFT JOIN categorias c ON cr.categoria_id = c.id
ORDER BY cr.created_at DESC
LIMIT 5;
```

## Status Final

### ✅ IMPLEMENTADO
- **Script SQL**: Criado para adicionar campo categoria_id
- **Interfaces TypeScript**: Atualizadas para incluir categoria_id
- **Tabela de exibição**: Modificada para buscar e exibir nomes
- **Funcionalidade**: Mantida compatibilidade com dados existentes

### 🔄 PRÓXIMOS PASSOS
1. Execute o script SQL no Supabase
2. Recarregue a página do Financeiro
3. Teste a funcionalidade de exibição de nomes
4. Teste a criação de novas contas a receber 