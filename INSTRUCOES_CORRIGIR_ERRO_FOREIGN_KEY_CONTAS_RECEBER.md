# Instruções para Corrigir Erro de Foreign Key Constraint

## Problema
```
Erro ao salvar conta a receber: insert or update on table "contas_receber" violates foreign key constraint "contas_receber_cliente_id_fkey"
```

## Causa
A tabela `contas_receber` tem uma constraint de foreign key que força o campo `cliente_id` a referenciar apenas a tabela `clientes`. Como agora estamos usando esse campo também para salvar IDs de fornecedores (no modal de comissão), a constraint está sendo violada.

## Solução

### 1. Execute o Script SQL
Abra o Supabase Dashboard e vá para o SQL Editor. Execute o script `corrigir_constraint_cliente_id_contas_receber.sql` que foi criado.

Este script irá:
- Verificar a constraint atual
- Remover a constraint `contas_receber_cliente_id_fkey`
- Verificar se a remoção foi bem-sucedida
- Mostrar a estrutura atual da tabela
- Verificar se há dados inválidos

### 2. Passos para Execução

#### Passo 1: Acessar Supabase
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Cole o conteúdo do arquivo `corrigir_constraint_cliente_id_contas_receber.sql`
4. Execute o script

#### Passo 2: Verificar Resultados
Após executar o script, verifique na aba "Results":

1. **Constraint atual**: Mostra se existe uma constraint
2. **Constraint removida**: Deve mostrar `false` após a remoção
3. **Estrutura da tabela**: Mostra todos os campos da tabela
4. **Dados existentes**: Mostra quantos registros existem
5. **Registros inválidos**: Mostra se há dados que precisam ser corrigidos

### 3. Como Funciona Agora

Após a correção, o sistema funcionará da seguinte forma:

#### Para Contas Normais (tipoReceberSelecionado === 'conta'):
- `cliente_id` = ID do cliente da tabela `clientes`
- `cliente_nome` = Nome do cliente

#### Para Comissões (tipoReceberSelecionado === 'comissao'):
- `cliente_id` = ID do fornecedor da tabela `fornecedores`
- `cliente_nome` = Nome do fornecedor

### 4. Teste a Funcionalidade

Após executar o script:

1. **Teste Contas Normais**:
   - Acesse a página Financeiro
   - Clique em "Nova Conta a Receber"
   - Selecione tipo "Conta"
   - Selecione um cliente
   - Salve a conta

2. **Teste Comissões**:
   - Clique em "Nova Conta a Receber"
   - Selecione tipo "Comissão"
   - Selecione um fornecedor
   - Salve a comissão

### 5. Verificações no Console

Após executar o script, teste a funcionalidade e verifique no console do navegador:

1. **Ao salvar conta**: Não deve aparecer erro de foreign key
2. **Ao salvar comissão**: Não deve aparecer erro de foreign key
3. **Se houver erro**: Será mostrado o erro específico do Supabase

### 6. Troubleshooting

#### Problema: Ainda aparece erro de foreign key
**Solução**:
1. Verifique se o script foi executado completamente
2. Verifique se a constraint foi removida (deve mostrar `false`)
3. Tente executar o script novamente

#### Problema: Dados não aparecem na tabela
**Solução**:
1. Verifique se há dados na tabela `contas_receber`
2. Verifique se o `empresa_id` está correto
3. Verifique os logs no console do navegador

#### Problema: Erro ao carregar fornecedores
**Solução**:
1. Verifique se a tabela `fornecedores` existe
2. Verifique se há fornecedores cadastrados
3. Verifique se as políticas RLS estão configuradas

### 7. Próximos Passos

Após corrigir o erro:

1. **Teste todas as funcionalidades**:
   - Salvar contas normais
   - Salvar comissões
   - Visualizar na tabela
   - Filtrar por período

2. **Verifique a exibição**:
   - Nomes dos clientes aparecem corretamente
   - Nomes dos fornecedores aparecem corretamente
   - Categorias aparecem corretamente

3. **Relate qualquer problema**:
   - Se houver novos erros
   - Se alguma funcionalidade não estiver funcionando
   - Se a interface não estiver exibindo corretamente 