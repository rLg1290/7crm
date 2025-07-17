# 🏢 Fornecedores por Empresa - Instruções de Teste

## 🎯 Objetivo
Implementar fornecedores específicos por empresa, onde cada empresa pode ter seus próprios fornecedores além dos fornecedores globais.

## 🔧 Estrutura Implementada

### Lógica de Acesso:
- **Fornecedores Globais**: `empresa_id = NULL` (visíveis para todas as empresas)
- **Fornecedores da Empresa**: `empresa_id = [ID_DA_EMPRESA]` (visíveis apenas para usuários da empresa)

### Estrutura da Tabela:
```sql
CREATE TABLE fornecedores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    email VARCHAR(255),
    telefone VARCHAR(20),
    user_id UUID REFERENCES auth.users(id),
    empresa_id UUID REFERENCES empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📋 Passos para Implementar

### 1. Execute o Script SQL
1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o script: `atualizar_fornecedores_empresa_id.sql`

### 2. O que o script faz:
- ✅ Verifica se a tabela `fornecedores` existe
- ✅ Cria a tabela se não existir com estrutura correta
- ✅ Adiciona coluna `empresa_id` se não existir
- ✅ Remove colunas problemáticas (`endereco`, `observacoes`, `cidade`, `estado`, `cep`)
- ✅ Configura políticas RLS para acesso por empresa
- ✅ Migra dados existentes (se houver)
- ✅ Insere fornecedores de exemplo (globais e específicos)

### 3. Políticas RLS Configuradas:
```sql
-- Usuários podem ver fornecedores globais e da sua empresa
-- Usuários podem inserir fornecedores para sua empresa
-- Usuários podem atualizar fornecedores da sua empresa
-- Usuários podem deletar fornecedores da sua empresa
```

## 🧪 Como Testar

### 1. Recarregue o Frontend
```bash
# O servidor já está rodando na porta 5175
# Acesse: http://localhost:5175
```

### 2. Teste a Criação de Fornecedor
1. Vá para a aba **Financeiro**
2. Clique em **Nova Conta a Pagar**
3. No campo **Fornecedor**, clique em **+ Novo Fornecedor**
4. Preencha os campos:
   - **Nome** (obrigatório)
   - **CNPJ** (opcional)
   - **Email** (opcional)
   - **Telefone** (opcional)
5. Clique em **Salvar Fornecedor**

### 3. Logs Esperados
No console do navegador, você deve ver:
```
🔧 [SERVICE] Adicionando fornecedor: {fornecedor: {...}, userId: "..."}
🔧 [SERVICE] Buscando empresa do usuário...
✅ [SERVICE] Empresa do usuário: [UUID_DA_EMPRESA]
🔧 [SERVICE] Dados a serem inseridos: {nome: "...", cnpj: "...", email: "...", telefone: "...", empresa_id: "..."}
✅ [SERVICE] Fornecedor adicionado com sucesso: {id: X, nome: "...", empresa_id: "..."}
```

### 4. Verificação no Banco
Execute no Supabase SQL Editor:
```sql
-- Verificar fornecedores criados
SELECT 
    id,
    nome,
    cnpj,
    email,
    telefone,
    CASE 
        WHEN empresa_id IS NULL THEN 'Global'
        ELSE 'Empresa Específica'
    END as tipo,
    empresa_id
FROM fornecedores 
ORDER BY nome;
```

## 🔍 Funcionalidades Testadas

### ✅ Criação de Fornecedor
- [ ] Fornecedor criado com `empresa_id` correto
- [ ] Modal fecha automaticamente
- [ ] Fornecedor aparece na lista
- [ ] Logs detalhados funcionando

### ✅ Listagem de Fornecedores
- [ ] Fornecedores globais aparecem (empresa_id = NULL)
- [ ] Fornecedores da empresa aparecem (empresa_id = [ID_EMPRESA])
- [ ] Lista ordenada por nome
- [ ] Sem erros 400

### ✅ Contas a Pagar
- [ ] Campo fornecedor carrega corretamente
- [ ] Novo fornecedor aparece no select
- [ ] Conta a pagar salva com fornecedor selecionado

## 🚨 Se Houver Problemas

### Verificar Estrutura da Tabela
```sql
-- Verificar colunas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'fornecedores' 
ORDER BY ordinal_position;
```

### Verificar Políticas RLS
```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'fornecedores';
```

### Verificar Relacionamento
```sql
-- Verificar se usuário tem empresa
SELECT ue.empresa_id, e.nome as empresa_nome
FROM usuarios_empresas ue
JOIN empresas e ON e.id = ue.empresa_id
WHERE ue.usuario_id = '[SEU_USER_ID]';
```

## 📊 Resultado Esperado

### Fornecedores Globais (visíveis para todos):
- CVC Viagens
- Decolar.com
- 123 Milhas
- Hoteis.com
- Booking.com

### Fornecedores da Empresa (visíveis apenas para usuários da empresa):
- Fornecedor Local A
- Fornecedor Local B
- [Novos fornecedores criados pelo usuário]

### Logs de Debug:
- Busca da empresa do usuário
- Busca de fornecedores globais
- Busca de fornecedores da empresa
- Combinação dos resultados
- Criação com empresa_id correto

## 🎯 Próximos Passos
Após confirmar que está funcionando:
1. Teste com múltiplas empresas
2. Verifique isolamento entre empresas
3. Teste edição de fornecedores
4. Implemente exclusão de fornecedores 