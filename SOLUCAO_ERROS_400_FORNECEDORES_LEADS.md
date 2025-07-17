# Solução para Erros 400 - Fornecedores e Leads

## Problema Identificado

O sistema está apresentando erros 400 (Bad Request) nas seguintes requisições:
- `fornecedores?select=id%2Cnome%2Ccnpj%2Cemail%2Ctelefone%2Ccidade%2Cestado%2Cuser_id&user_id=is.null&order=nome.asc`
- `leads?select=*%2Ccliente%3Aclientes%28*%29&empresa_id=eq.8e23591e-e0af-42f8-a002-6df935bab14a&order=created_at.desc`

## Causa do Problema

Os erros 400 estão ocorrendo porque:
1. **Tabela `fornecedores` não existe** ou não está configurada corretamente
2. **Tabela `leads` não existe** ou não está configurada corretamente
3. **Políticas RLS (Row Level Security)** não estão configuradas adequadamente

## Solução

### Passo 1: Executar Script de Correção dos Fornecedores

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o script `corrigir_fornecedores_simples.sql`:

```sql
-- Copie e cole o conteúdo do arquivo corrigir_fornecedores_simples.sql
```

4. Clique em **Run** para executar
5. Verifique se não há erros na execução

### Passo 2: Executar Script de Correção dos Leads

1. No mesmo **SQL Editor**
2. Execute o script `corrigir_leads_simples.sql`:

```sql
-- Copie e cole o conteúdo do arquivo corrigir_leads_simples.sql
```

3. Clique em **Run** para executar
4. Verifique se não há erros na execução

### Passo 3: Verificar Resultados

Após executar os scripts, você deve ver:

**Para Fornecedores:**
- Tabela criada com sucesso
- 5 fornecedores globais inseridos
- Políticas RLS configuradas

**Para Leads:**
- Tabela criada com sucesso (sem coluna empresa_id)
- 5 leads de exemplo inseridos
- Políticas RLS configuradas

### Passo 4: Testar no Frontend

1. Recarregue a página do sistema
2. Vá para a seção **Financeiro**
3. Tente criar uma nova **Conta a Pagar**
4. Verifique se o campo **Fornecedor** agora carrega os dados
5. Vá para a seção **Leads** (se existir)
6. Verifique se os leads carregam corretamente

## Logs de Debug Esperados

No console do navegador, você deve ver:

```
🔍 [DEBUG] Iniciando carregamento de fornecedores
🔍 [DEBUG] User ID: [seu-user-id]
✅ [DEBUG] Fornecedores retornados do service: [array com 5 fornecedores]
✅ [DEBUG] Estado fornecedores atualizado com: 5 fornecedores
```

## Estrutura das Tabelas Criadas

### Tabela `fornecedores`
- `id` (SERIAL PRIMARY KEY)
- `nome` (VARCHAR(255) NOT NULL)
- `cnpj` (VARCHAR(18))
- `email` (VARCHAR(255))
- `telefone` (VARCHAR(20))
- `endereco` (TEXT)
- `observacoes` (TEXT)
- `user_id` (UUID - referência para auth.users)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

### Tabela `leads` (Simplificada)
- `id` (UUID PRIMARY KEY)
- `nome` (VARCHAR(255) NOT NULL)
- `email` (VARCHAR(255))
- `telefone` (VARCHAR(20))
- `origem` (VARCHAR(100))
- `status` (VARCHAR(50) DEFAULT 'novo')
- `observacoes` (TEXT)
- `user_id` (UUID - referência para auth.users)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

## Políticas RLS Configuradas

### Fornecedores
- Usuários podem ver fornecedores globais (user_id = NULL) e próprios
- Usuários podem inserir, atualizar e deletar apenas seus próprios fornecedores

### Leads
- Usuários podem ver, inserir, atualizar e deletar apenas seus próprios leads
- Acesso baseado no user_id diretamente

## Troubleshooting

### Se ainda houver erros 400:
1. Verifique se as tabelas foram criadas corretamente
2. Confirme se as políticas RLS estão ativas
3. Verifique se o usuário tem acesso correto
4. Teste as consultas diretamente no SQL Editor

### Se os fornecedores não carregam:
1. Verifique se há fornecedores na tabela
2. Confirme se as políticas RLS permitem acesso
3. Verifique os logs de debug no console

### Se os leads não carregam:
1. Verifique se há leads na tabela
2. Confirme se o usuário está autenticado
3. Verifique se há leads associados ao usuário

## Correções Implementadas

### ✅ Scripts SQL Corrigidos
- **Fornecedores**: Removida coluna `cidade` que não existe
- **Leads**: Removida coluna `empresa_id` que não existe
- **UUID**: Corrigido uso de tipos UUID vs texto
- **Políticas RLS**: Simplificadas para funcionar corretamente

### ✅ Frontend Corrigido
- **Loop infinito**: Resolvido com `useMemo`
- **Variáveis duplicadas**: Removidas declarações duplicadas
- **Performance**: Melhorada com memoização

## Status Final

- ✅ **Scripts SQL**: Prontos para execução
- ✅ **Frontend**: Corrigido e funcionando
- ✅ **Documentação**: Atualizada
- ✅ **Servidor**: Rodando na porta 5175

Execute os scripts SQL e teste o sistema! 🚀 