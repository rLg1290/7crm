# Instruções para Contas a Pagar (Atualizado com Fornecedor)

## Problema
As contas a pagar não estão sendo salvas no banco de dados e faltava o campo fornecedor.

## Solução

### 1. Execute os Scripts SQL
Abra o Supabase Dashboard e vá para o SQL Editor. Execute os scripts na seguinte ordem:

1. **Primeiro**: `verificar_fornecedores.sql` - Cria a tabela fornecedores
2. **Segundo**: `verificar_contas_pagar.sql` - Cria/atualiza a tabela contas_pagar com campo fornecedor_id

### 2. Estrutura das Tabelas

#### Tabela `fornecedores`:
- `id` (SERIAL PRIMARY KEY)
- `nome` (VARCHAR(200) NOT NULL)
- `cnpj` (VARCHAR(18))
- `email` (VARCHAR(100))
- `telefone` (VARCHAR(20))
- `endereco` (TEXT)
- `cidade` (VARCHAR(100))
- `estado` (VARCHAR(2))
- `cep` (VARCHAR(10))
- `observacoes` (TEXT)
- `user_id` (UUID)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

#### Tabela `contas_pagar` (atualizada):
- `id` (SERIAL PRIMARY KEY)
- `categoria` (VARCHAR(100) NOT NULL)
- `fornecedor_id` (INTEGER) - **NOVO CAMPO**
- `forma_pagamento` (VARCHAR(100) NOT NULL)
- `valor` (DECIMAL(10,2) NOT NULL)
- `parcelas` (VARCHAR(10) NOT NULL)
- `vencimento` (DATE NOT NULL)
- `status` (VARCHAR(20) DEFAULT 'PENDENTE')
- `observacoes` (TEXT)
- `origem` (VARCHAR(50) DEFAULT 'MANUAL')
- `origem_id` (VARCHAR(255))
- `user_id` (UUID NOT NULL)
- `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- **FOREIGN KEY**: `fornecedor_id` REFERENCES `fornecedores(id)`

### 3. Verificações no Console
Após executar os scripts, teste a funcionalidade e verifique no console do navegador:

1. **Ao carregar a página**: Deve aparecer "Carregando fornecedores para usuário: [ID]"
2. **Ao adicionar nova conta**: Deve aparecer "Iniciando salvamento de conta a pagar: {...}"
3. **Se houver erro**: Será mostrado o erro específico do Supabase

### 4. Teste a Funcionalidade

1. Acesse a página Financeiro
2. Clique em "Adicionar Conta a Pagar"
3. Preencha os campos obrigatórios:
   - Categoria (selecione uma categoria)
   - Valor (digite o valor da conta)
   - Forma de Pagamento (selecione uma forma)
   - Vencimento (selecione uma data)
4. Preencha os campos opcionais:
   - Fornecedor (selecione um fornecedor ou adicione um novo)
   - Parcelas (número de parcelas)
   - Status (pendente, paga, vencida)
   - Observações (texto adicional)
5. Clique em "Salvar"

### 5. Funcionalidades Adicionadas

#### Campo Fornecedor:
- **Select dropdown** com fornecedores existentes
- **Botão "+"** para adicionar novo fornecedor
- **Modal** para cadastro de novo fornecedor com campos:
  - Nome (obrigatório)
  - CNPJ
  - Email
  - Telefone
  - Endereço
  - Cidade
  - Estado
  - CEP
  - Observações

#### Fornecedores Globais e Próprios:
- Fornecedores globais (user_id IS NULL) são visíveis para todos
- Fornecedores próprios (user_id = usuário atual) são privados
- Ambos aparecem no dropdown de seleção

### 6. Verificação no Supabase

Após salvar, você pode verificar no Supabase Dashboard:
1. Vá para Table Editor
2. Selecione a tabela `contas_pagar`
3. Verifique se o novo registro foi criado com `fornecedor_id`
4. Selecione a tabela `fornecedores` para ver fornecedores cadastrados

### 7. Estrutura dos Dados

A conta a pagar agora deve ter:
- **categoria**: Nome da categoria (ex: "Aluguel", "Internet")
- **fornecedor_id**: ID do fornecedor (opcional)
- **valor**: Valor numérico da conta (ex: 1500.00)
- **forma_pagamento**: Nome da forma de pagamento (ex: "PIX", "Boleto")
- **parcelas**: Número de parcelas como string (ex: "1", "12")
- **vencimento**: Data no formato YYYY-MM-DD
- **status**: "PENDENTE", "PAGA" ou "VENCIDA"
- **observacoes**: Texto opcional
- **origem**: "MANUAL" por padrão
- **user_id**: ID do usuário autenticado

### 8. Logs de Debug

Os logs de debug foram adicionados para ajudar a identificar problemas:
- Console do navegador mostrará todos os passos
- Erros específicos do Supabase serão exibidos
- Confirmação de sucesso será mostrada
- Validação de campos obrigatórios

Se ainda houver problemas, verifique os logs no console e me informe qual erro específico está aparecendo. 