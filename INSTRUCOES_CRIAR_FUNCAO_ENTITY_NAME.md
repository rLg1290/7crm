# Instruções para Criar a Função get_entity_name_from_contas_receber

## Problema
O erro indica que a função `get_entity_name_from_contas_receber(integer)` não existe no banco de dados, mas está sendo chamada em uma consulta SQL.

## Solução
Execute o script `criar_funcao_get_entity_name.sql` para criar a função necessária.

## Passos para Executar

### 1. Acesse o Supabase
- Vá para o painel do Supabase
- Acesse o projeto do 7CRM
- Vá para a seção "SQL Editor"

### 2. Execute o Script
- Abra o arquivo `criar_funcao_get_entity_name.sql`
- Copie todo o conteúdo
- Cole no SQL Editor do Supabase
- Clique em "Run" para executar

### 3. Verificação
Após executar o script, você deve ver:
- Uma mensagem de sucesso indicando que a função foi criada
- Uma consulta de verificação mostrando os detalhes da função criada

## O que a Função Faz

A função `get_entity_name_from_contas_receber` recebe o ID de uma conta a receber e retorna:

1. **Nome do Cliente**: Se a conta tem `cliente_id` preenchido
2. **Nome do Fornecedor**: Se a conta tem `fornecedor_id` preenchido  
3. **"Entidade não encontrada"**: Se não encontrar nenhum nome
4. **NULL**: Se a conta não existir

## Exemplo de Uso

```sql
-- Buscar o nome da entidade de uma conta específica
SELECT get_entity_name_from_contas_receber(1);

-- Usar em uma consulta completa
SELECT 
    cr.*,
    get_entity_name_from_contas_receber(cr.id) as nome_entidade
FROM contas_receber cr;
```

## Próximos Passos

Após criar a função:
1. Teste o sistema de contas a receber
2. Verifique se os nomes das entidades aparecem corretamente na tabela
3. Teste tanto contas normais (com cliente) quanto comissões (com fornecedor)

## Troubleshooting

Se ainda houver erros:
1. Verifique se a função foi criada: `SELECT * FROM pg_proc WHERE proname = 'get_entity_name_from_contas_receber';`
2. Confirme que as tabelas `clientes` e `fornecedores` existem
3. Verifique se os campos `cliente_id` e `fornecedor_id` existem na tabela `contas_receber` 