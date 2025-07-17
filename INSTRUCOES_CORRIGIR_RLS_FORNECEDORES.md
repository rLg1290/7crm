# 🔧 Correção do Erro RLS - Fornecedores

## 🚨 Problema Identificado
Erro 403 (Forbidden) ao tentar salvar fornecedor:
```
new row violates row-level security policy for table "fornecedores"
```

## 🔍 Causa do Problema
As políticas RLS (Row Level Security) da tabela `fornecedores` estão bloqueando a inserção de novos fornecedores.

## 📋 Solução

### 1. Execute o Script SQL
1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o script: `corrigir_rls_fornecedores.sql`

### 2. O que o script faz:
- ✅ Verifica se a tabela `fornecedores` existe
- ✅ Verifica se RLS está habilitado
- ✅ Remove políticas RLS existentes (problemáticas)
- ✅ Cria novas políticas RLS corrigidas
- ✅ Verifica se o usuário tem empresa
- ✅ Lista fornecedores existentes

### 3. Políticas RLS Corrigidas:
```sql
-- SELECT: Usuários podem ver fornecedores globais e da sua empresa
-- INSERT: Usuários podem inserir fornecedores para sua empresa
-- UPDATE: Usuários podem atualizar fornecedores da sua empresa
-- DELETE: Usuários podem deletar fornecedores da sua empresa
```

## 🧪 Como Testar

### 1. Execute o Script SQL
Execute o script `corrigir_rls_fornecedores.sql` no Supabase.

### 2. Verifique os Resultados
O script deve mostrar:
- ✅ Tabela fornecedores existe: true
- ✅ RLS habilitado: true
- ✅ 4 políticas criadas
- ✅ Usuário atual tem empresa: [dados da empresa]
- ✅ Lista de fornecedores existentes

### 3. Teste no Frontend
1. **Recarregue o frontend** (já está rodando na porta 5175)
2. **Vá para Financeiro → Nova Conta a Pagar**
3. **Clique em "+ Novo Fornecedor"**
4. **Preencha os campos**:
   - Nome: "Teste Fornecedor"
   - CNPJ: (opcional)
   - Email: (opcional)
   - Telefone: (opcional)
5. **Clique em "Salvar Fornecedor"**

### 4. Logs Esperados
```
🔧 [SERVICE] Adicionando fornecedor: {fornecedor: {...}, userId: "..."}
🔧 [SERVICE] Buscando empresa do usuário...
✅ [SERVICE] Empresa do usuário: [UUID_DA_EMPRESA]
🔧 [SERVICE] Dados a serem inseridos: {nome: "...", empresa_id: "..."}
✅ [SERVICE] Fornecedor adicionado com sucesso: {id: X, nome: "...", empresa_id: "..."}
```

## 🚨 Se Ainda Houver Problemas

### Verificar Políticas RLS
Execute no Supabase SQL Editor:
```sql
-- Verificar políticas atuais
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'fornecedores'
ORDER BY policyname;
```

### Verificar Relacionamento Usuário-Empresa
```sql
-- Verificar se usuário tem empresa
SELECT 
    ue.usuario_id,
    ue.empresa_id,
    e.nome as empresa_nome
FROM usuarios_empresas ue
JOIN empresas e ON e.id = ue.empresa_id
WHERE ue.usuario_id = '[SEU_USER_ID]';
```

### Verificar Estrutura da Tabela
```sql
-- Verificar colunas da tabela fornecedores
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'fornecedores' 
ORDER BY ordinal_position;
```

## 📊 Resultado Esperado

### ✅ Após Executar o Script:
- Políticas RLS corrigidas
- Usuário pode inserir fornecedores para sua empresa
- Usuário pode ver fornecedores globais e da sua empresa
- Sem erros 403 (Forbidden)

### ✅ Após Testar no Frontend:
- Fornecedor salvo com sucesso
- Modal fecha automaticamente
- Fornecedor aparece na lista
- Logs detalhados funcionando

## 🔄 Próximos Passos
Após confirmar que está funcionando:
1. Teste criação de múltiplos fornecedores
2. Verifique se aparecem apenas fornecedores da empresa
3. Teste edição de fornecedores
4. Teste exclusão de fornecedores 