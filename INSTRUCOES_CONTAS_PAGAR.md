# Instruções para Corrigir Contas a Pagar

## Problema
As contas a pagar não estão sendo salvas no banco de dados.

## Solução

### 1. Execute o Script SQL
Abra o Supabase Dashboard e vá para o SQL Editor. Execute o script `verificar_contas_pagar.sql` que foi criado.

Este script irá:
- Verificar se a tabela `contas_pagar` existe
- Criar a tabela se ela não existir com a estrutura correta:
  - `id` (SERIAL PRIMARY KEY)
  - `categoria` (VARCHAR(100) NOT NULL)
  - `forma_pagamento` (VARCHAR(100) NOT NULL)
  - `parcelas` (VARCHAR(10) NOT NULL)
  - `vencimento` (DATE NOT NULL)
  - `status` (VARCHAR(20) DEFAULT 'PENDENTE')
  - `observacoes` (TEXT)
  - `origem` (VARCHAR(50) DEFAULT 'MANUAL')
  - `origem_id` (VARCHAR(255))
  - `user_id` (UUID NOT NULL)
  - `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- Configurar as políticas RLS (Row Level Security)

### 2. Verificações no Console
Após executar o script, teste a funcionalidade e verifique no console do navegador:

1. **Ao carregar a página**: Deve aparecer "Buscando contas a pagar para usuário: [ID]"
2. **Ao adicionar nova conta**: Deve aparecer "Iniciando salvamento de conta a pagar: {...}"
3. **Se houver erro**: Será mostrado o erro específico do Supabase

### 3. Possíveis Problemas e Soluções

#### Problema: Tabela não existe
**Solução**: Execute o script SQL completo

#### Problema: Erro de RLS (Row Level Security)
**Solução**: O script já configura as políticas RLS necessárias

#### Problema: Erro de permissão
**Solução**: Verifique se o usuário está autenticado corretamente

#### Problema: Campos obrigatórios não preenchidos
**Solução**: Adicionei validação no formulário para verificar campos obrigatórios

#### Problema: Formato de data incorreto
**Solução**: Verifique se a data está no formato YYYY-MM-DD

### 4. Teste a Funcionalidade

1. Acesse a página Financeiro
2. Clique em "Adicionar Conta a Pagar"
3. Preencha os campos obrigatórios:
   - Categoria (selecione uma categoria)
   - Valor (digite o valor da conta)
   - Forma de Pagamento (selecione uma forma)
   - Vencimento (selecione uma data)
4. Preencha os campos opcionais se desejar
5. Clique em "Salvar"

### 5. Verificação no Supabase

Após salvar, você pode verificar no Supabase Dashboard:
1. Vá para Table Editor
2. Selecione a tabela `contas_pagar`
3. Verifique se o novo registro foi criado

### 6. Logs de Debug

Os logs de debug foram adicionados para ajudar a identificar problemas:
- Console do navegador mostrará todos os passos
- Erros específicos do Supabase serão exibidos
- Confirmação de sucesso será mostrada
- Validação de campos obrigatórios

### 7. Estrutura dos Dados

A conta a pagar deve ter:
- **categoria**: Nome da categoria (ex: "Aluguel", "Internet")
- **valor**: Valor numérico da conta (ex: 1500.00)
- **forma_pagamento**: Nome da forma de pagamento (ex: "PIX", "Boleto")
- **parcelas**: Número de parcelas como string (ex: "1", "12")
- **vencimento**: Data no formato YYYY-MM-DD
- **status**: "PENDENTE", "PAGA" ou "VENCIDA"
- **observacoes**: Texto opcional
- **origem**: "MANUAL" por padrão
- **user_id**: ID do usuário autenticado

Se ainda houver problemas, verifique os logs no console e me informe qual erro específico está aparecendo. 