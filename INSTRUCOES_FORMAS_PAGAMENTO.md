# Instruções para Corrigir Formas de Pagamento

## Problema
A forma de pagamento não está sendo salva na tabela `formas_pagamento`.

## Solução

### 1. Execute o Script SQL
Abra o Supabase Dashboard e vá para o SQL Editor. Execute o script `verificar_formas_pagamento.sql` que foi criado.

Este script irá:
- Verificar se a tabela `formas_pagamento` existe
- Criar a tabela se ela não existir com a estrutura correta:
  - `id` (SERIAL PRIMARY KEY)
  - `nome` (VARCHAR(100) NOT NULL)
  - `user_id` (UUID)
  - `created_at` (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- Inserir formas de pagamento padrão (globais)
- Configurar as políticas RLS (Row Level Security)

### 2. Verificações no Console
Após executar o script, teste a funcionalidade e verifique no console do navegador:

1. **Ao carregar a página**: Deve aparecer "Carregando formas de pagamento para usuário: [ID]"
2. **Ao adicionar nova forma**: Deve aparecer "Tentando salvar forma de pagamento: {nome: '...', user_id: '...'}"
3. **Se houver erro**: Será mostrado o erro específico do Supabase

### 3. Possíveis Problemas e Soluções

#### Problema: Tabela não existe
**Solução**: Execute o script SQL completo

#### Problema: Erro de RLS (Row Level Security)
**Solução**: O script já configura as políticas RLS necessárias

#### Problema: Erro de permissão
**Solução**: Verifique se o usuário está autenticado corretamente

#### Problema: Campo user_id não aceita NULL
**Solução**: O script já define o campo como nullable

### 4. Teste a Funcionalidade

1. Acesse a página Financeiro
2. Clique em "Adicionar Conta a Pagar"
3. Clique no botão "+" ao lado do campo "Forma de Pagamento"
4. Digite o nome da nova forma de pagamento
5. Clique em "Salvar"

### 5. Verificação no Supabase

Após salvar, você pode verificar no Supabase Dashboard:
1. Vá para Table Editor
2. Selecione a tabela `formas_pagamento`
3. Verifique se o novo registro foi criado

### 6. Logs de Debug

Os logs de debug foram adicionados para ajudar a identificar problemas:
- Console do navegador mostrará todos os passos
- Erros específicos do Supabase serão exibidos
- Confirmação de sucesso será mostrada

Se ainda houver problemas, verifique os logs no console e me informe qual erro específico está aparecendo. 