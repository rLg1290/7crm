# Instruções para Testar Fornecedores Filtrados por Empresa

## Implementação Realizada

### 1. Campo `empresa_id` Adicionado
- ✅ Campo `empresa_id` adicionado à tabela `fornecedores`
- ✅ Campo pode ser nulo (para fornecedores globais)
- ✅ Suporte a fornecedores globais, do usuário e da empresa

### 2. Service Atualizado
- ✅ Função `getFornecedores` agora aceita parâmetro `empresaId`
- ✅ Busca fornecedores globais (`user_id IS NULL` e `empresa_id IS NULL`)
- ✅ Busca fornecedores do usuário (`user_id = userId`)
- ✅ Busca fornecedores da empresa (`empresa_id = empresaId`)
- ✅ Remove duplicatas automaticamente

### 3. Frontend Atualizado
- ✅ Passa `empresa_id` do usuário ao carregar fornecedores
- ✅ Exibe origem dos fornecedores (🌐 Global, 👤 Usuário, 🏢 Empresa)
- ✅ Interface atualizada para incluir campo `empresa_id`

## Como Testar

### 1. Execute os Scripts SQL

1. **Adicionar campo empresa_id:**
   ```sql
   -- Execute o script adicionar_apenas_empresa_id_fornecedores.sql
   ```

2. **Inserir dados de teste:**
   ```sql
   -- Execute o script inserir_fornecedores_teste_completo.sql
   ```

### 2. Teste no Frontend

1. **Acesse a página Financeiro**
2. **Clique em "Nova Conta a Pagar"**
3. **No campo "Fornecedor", você deve ver:**
   - 🌐 Global - Fornecedor Global 1
   - 🌐 Global - Fornecedor Global 2
   - 🌐 Global - Fornecedor Global 3
   - 🏢 Empresa - Fornecedor Empresa 1 (se o usuário tiver empresa_id)
   - 🏢 Empresa - Fornecedor Empresa 2 (se o usuário tiver empresa_id)

### 3. Verificar Logs

Abra o console do navegador e verifique os logs:
- "Carregando fornecedores para usuário: [userId] empresa: [empresaId]"
- "Resumo dos fornecedores encontrados:"
- "- Globais: X"
- "- Próprios do usuário: Y"
- "- Da empresa: Z"

### 4. Testar Diferentes Cenários

#### Cenário 1: Usuário sem empresa
- Deve mostrar apenas fornecedores globais e do usuário

#### Cenário 2: Usuário com empresa
- Deve mostrar fornecedores globais, do usuário e da empresa

#### Cenário 3: Adicionar novo fornecedor
- Teste adicionar um novo fornecedor
- Verifique se aparece na lista após adicionar

## Estrutura dos Fornecedores

### Tipos de Fornecedores

1. **🌐 Globais:**
   - `user_id = NULL`
   - `empresa_id = NULL`
   - Disponíveis para todos os usuários

2. **👤 Usuário:**
   - `user_id = UUID do usuário`
   - `empresa_id = NULL`
   - Disponíveis apenas para o usuário específico

3. **🏢 Empresa:**
   - `user_id = NULL`
   - `empresa_id = UUID da empresa`
   - Disponíveis para todos os usuários da empresa

## Próximos Passos

1. Execute os scripts SQL
2. Teste no frontend
3. Verifique se os fornecedores aparecem corretamente
4. Teste adicionar novos fornecedores
5. Reporte qualquer problema encontrado

## Comandos de Verificação

```sql
-- Verificar estrutura da tabela
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'fornecedores'
ORDER BY ordinal_position;

-- Verificar fornecedores por origem
SELECT 
    CASE 
        WHEN user_id IS NOT NULL THEN '👤 Usuário'
        WHEN empresa_id IS NOT NULL THEN '🏢 Empresa'
        ELSE '🌐 Global'
    END as origem,
    COUNT(*) as quantidade
FROM fornecedores 
GROUP BY origem
ORDER BY origem;
``` 