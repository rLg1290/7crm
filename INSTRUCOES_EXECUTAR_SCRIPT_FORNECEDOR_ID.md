# Instruções para Executar Script SQL - Adicionar fornecedor_id

## Problema
O erro "Could not find the 'fornecedor_id' column of 'contas_receber' in the schema cache" indica que a coluna `fornecedor_id` não existe na tabela `contas_receber`.

## Solução
Execute o script `solucao_campos_separados_cliente_fornecedor.sql` no Supabase.

## Passos para Executar

### 1. Acesse o Supabase
- Vá para o painel do Supabase
- Acesse o projeto do 7CRM
- Vá para a seção "SQL Editor"

### 2. Execute o Script
- Abra o arquivo `solucao_campos_separados_cliente_fornecedor.sql`
- Copie todo o conteúdo
- Cole no SQL Editor do Supabase
- Clique em "Run" para executar

### 3. Verificação
Após executar o script, você deve ver:
- Mensagens de sucesso indicando que o campo foi adicionado
- Estrutura atualizada da tabela
- Constraints criadas
- Função `get_entity_name_from_contas_receber` criada

## O que o Script Faz

1. **Adiciona campo `fornecedor_id`** na tabela `contas_receber`
2. **Remove campo `tipo_entidade`** se existir (não precisamos mais)
3. **Cria constraint** para garantir que apenas um dos campos seja preenchido
4. **Cria função** para buscar nomes das entidades
5. **Verifica estrutura** final da tabela

## Estrutura Final da Tabela

A tabela `contas_receber` terá:
- `cliente_id` (TEXT) - para contas normais
- `fornecedor_id` (INTEGER) - para comissões
- Constraint: apenas um dos dois pode ser preenchido

## Próximos Passos

Após executar o script:
1. Teste criar uma conta a receber normal (com cliente)
2. Teste criar uma comissão (com fornecedor)
3. Verifique se os nomes aparecem corretamente na tabela

## Troubleshooting

Se ainda houver erros:
1. Verifique se o script foi executado completamente
2. Confirme que a coluna `fornecedor_id` existe: `SELECT column_name FROM information_schema.columns WHERE table_name = 'contas_receber';`
3. Verifique se a função foi criada: `SELECT * FROM pg_proc WHERE proname = 'get_entity_name_from_contas_receber';`

## Importante
Execute o script completo de uma vez para evitar problemas de dependências. 