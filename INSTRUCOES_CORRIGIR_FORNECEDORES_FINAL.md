# 🔧 Instruções para Corrigir Problema dos Fornecedores

## 📋 Problema Identificado
O erro indica que a coluna `endereco` não existe na tabela `fornecedores` no banco de dados, causando erro 400 nas requisições.

## 🛠️ Solução

### 1. Execute o Script SQL
1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o script: `corrigir_fornecedores_simples_final.sql`

### 2. O que o script faz:
- ✅ Verifica se a tabela `fornecedores` existe
- ✅ Cria a tabela se não existir com estrutura simples
- ✅ Remove colunas problemáticas (`endereco`, `observacoes`, `cidade`, `estado`)
- ✅ Configura políticas RLS para acesso seguro
- ✅ Insere fornecedores de exemplo globais
- ✅ Mostra o resultado final

### 3. Estrutura da Tabela Após Correção:
```sql
CREATE TABLE fornecedores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    email VARCHAR(255),
    telefone VARCHAR(20),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Lógica de Acesso:
- **Fornecedores Globais**: `user_id IS NULL` → Aparecem para todos os usuários
- **Fornecedores Próprios**: `user_id = auth.uid()` → Aparecem apenas para o usuário que criou

## 🔄 Após Executar o Script

### 1. Recarregue o Frontend
- Recarregue a página do sistema
- Vá para a aba **Financeiro**

### 2. Teste a Funcionalidade
1. Clique em **"Nova Conta a Pagar"**
2. No campo **"Fornecedor"**, deve aparecer:
   - CVC Viagens
   - Decolar.com
   - 123 Milhas
   - Hoteis.com
   - Booking.com

### 3. Logs Esperados no Console:
```
🔍 [SERVICE] Iniciando busca de fornecedores para usuário: [user-id]
🔍 [SERVICE] Buscando fornecedores globais...
✅ [SERVICE] Fornecedores globais encontrados: 5
✅ [SERVICE] Detalhes globais: [array com 5 fornecedores]
🔍 [SERVICE] Buscando fornecedores próprios do usuário...
✅ [SERVICE] Fornecedores próprios encontrados: 0
✅ [SERVICE] Total de fornecedores combinados: 5
```

## 🚨 Se o Problema Persistir

### Verificar Estrutura da Tabela:
```sql
-- Execute no SQL Editor para verificar a estrutura atual
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'fornecedores' 
ORDER BY ordinal_position;
```

### Verificar Dados:
```sql
-- Execute para verificar se há dados
SELECT COUNT(*) as total FROM fornecedores;
SELECT * FROM fornecedores LIMIT 5;
```

## 📝 Próximos Passos

Após corrigir o problema básico, podemos implementar a lógica de `empresa_id` conforme solicitado:

1. **Estrutura com empresa_id**: Se `empresa_id IS NULL` → Global, se definido → Apenas para usuários dessa empresa
2. **Políticas RLS avançadas**: Baseadas na relação usuário-empresa
3. **Interface melhorada**: Mostrar tipo do fornecedor (Global/Empresa)

## ✅ Checklist de Verificação

- [ ] Script SQL executado com sucesso
- [ ] Tabela `fornecedores` criada/corrigida
- [ ] Fornecedores de exemplo inseridos
- [ ] Frontend recarregado
- [ ] Campo fornecedor carrega no modal
- [ ] Logs de debug mostram sucesso
- [ ] Funcionalidade de criar conta a pagar funciona

## 🆘 Suporte

Se ainda houver problemas, verifique:
1. Logs do console do navegador
2. Logs do Supabase (Database > Logs)
3. Estrutura atual da tabela no Supabase 