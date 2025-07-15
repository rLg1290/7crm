# 🔧 Resolver Erro da Tabela Empresas no Supabase

## 🚨 Problema Identificado
A página de impressão está falhando ao buscar dados da tabela `empresas` com erro HTTP 400, indicando problemas na consulta SQL ou estrutura da tabela.

## 📋 Passos para Resolver

### 1. **Verificar e Corrigir a Tabela Empresas**

Execute os comandos do arquivo `debug_empresas_supabase.sql` **um por vez** no SQL Editor do Supabase:

#### a) Verificar se a tabela existe:
```sql
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'empresas';
```

#### b) Verificar estrutura da tabela:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'empresas' AND table_schema = 'public'
ORDER BY ordinal_position;
```

#### c) Verificar dados existentes:
```sql
SELECT id, nome, cnpj, created_at FROM empresas;
```

### 2. **Se a Tabela Não Existir ou Estiver Incompleta**

Execute para criar/completar a tabela:

```sql
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cnpj TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    cor_personalizada TEXT DEFAULT '#0d9488',
    logotipo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. **Inserir Dados de Teste**

```sql
INSERT INTO empresas (id, nome, cnpj, telefone, email, endereco, cor_personalizada)
SELECT 
    '8e23591e-e0af-42f8-a002-6df935bab14a'::uuid,
    'Agência de Turismo Exemplo',
    '12.345.678/0001-90',
    '(11) 99999-9999',
    'contato@agencia.com.br',
    'Rua Principal, 123 - Centro',
    '#2563eb'
WHERE NOT EXISTS (
    SELECT 1 FROM empresas WHERE id = '8e23591e-e0af-42f8-a002-6df935bab14a'::uuid
);
```

### 4. **Verificar RLS (Row Level Security)**

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'empresas';
```

**Se houver políticas RLS muito restritivas, você pode temporariamente desabilitá-las:**
```sql
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
```

### 5. **Testar a Consulta**

```sql
SELECT * FROM empresas WHERE id = '8e23591e-e0af-42f8-a002-6df935bab14a';
```

## 🔍 Diagnóstico dos Logs

Os logs no console mostram:
- ✅ **Cotação carregada corretamente**
- ✅ **empresa_id encontrado:** `8e23591e-e0af-42f8-a002-6df935bab14a`
- ❌ **Erro 400 na consulta à tabela empresas**

## 💡 Possíveis Causas do Erro 400

1. **Tabela não existe** ou tem estrutura diferente
2. **Políticas RLS** muito restritivas
3. **Campos inexistentes** na consulta
4. **Permissões** insuficientes
5. **UUID inválido** ou malformado

## ✅ Resolução Implementada

1. **Simplificamos a consulta** para usar `SELECT *` em vez de campos específicos
2. **Melhoramos o tratamento de erro** para mostrar detalhes específicos
3. **Mantivemos o sistema de fallback** robusto
4. **Dados padrão de emergência** caso tudo falhe

## 🧪 Teste Após Correções

1. Execute os SQLs no Supabase
2. Recarregue a página de impressão
3. Verifique os logs no console do navegador
4. Confirme se exibe:
   - ✅ Nome da empresa correto
   - ✅ CNPJ da empresa correto  
   - ✅ Cor personalizada aplicada

## 📞 Suporte

Se persistir o erro, execute este diagnóstico e compartilhe os resultados:

```sql
-- Diagnóstico completo
SELECT 'TABELA EXISTE' as status, table_name FROM information_schema.tables WHERE table_name = 'empresas'
UNION ALL
SELECT 'TOTAL REGISTROS', COUNT(*)::text FROM empresas
UNION ALL  
SELECT 'PRIMEIRO REGISTRO', nome FROM empresas LIMIT 1;
``` 