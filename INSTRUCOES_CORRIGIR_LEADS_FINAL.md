# 🔧 Correção da Tabela Leads - SOLUÇÃO FINAL

## 🚨 Problema Identificado

O sistema está apresentando erros 400 (Bad Request) ao tentar acessar a tabela `leads`:

```
ethmgnxyrgpkzgmkocwk.supabase.co/rest/v1/leads?select=*%2Ccliente%3Aclientes%28*%29&empresa_id=eq.8e23591e-e0af-42f8-a002-6df935bab14a&order=created_at.desc:1 Failed to load resource: the server responded with a status of 400 ()
```

**Erro adicional**: `ERROR: 22P02: invalid input syntax for type uuid: "20"` - Problema com tipo de dados UUID.

## 🔍 Causa do Problema

A tabela `leads` tem uma estrutura incompatível com o que o frontend espera:

### Estrutura Atual (Incorreta):
- `id` (UUID)
- `nome` (VARCHAR)
- `email` (VARCHAR)
- `telefone` (VARCHAR)
- `origem` (VARCHAR)
- `status` (VARCHAR)
- `observacoes` (TEXT)
- `user_id` (UUID)

### Estrutura Esperada (Correta):
- `id` (SERIAL)
- `empresa_id` (UUID)
- `cliente_id` (BIGINT) ← **CORRIGIDO: era UUID, agora BIGINT**
- `observacao` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## ✅ Solução

### Passo 1: Executar Script de Correção

1. **Acesse o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Cole o conteúdo do arquivo `corrigir_leads_final.sql`**
4. **Execute o script**

### Passo 2: O que o Script Faz

1. **Verifica se a tabela existe**
2. **Cria a tabela com estrutura correta** (se não existir)
3. **Corrige a estrutura** (se existir):
   - Remove colunas desnecessárias (`nome`, `email`, `telefone`, etc.)
   - Adiciona colunas necessárias (`empresa_id`, `cliente_id`, `observacao`)
   - **Corrige tipo de dados**: `cliente_id` como BIGINT (não UUID)
4. **Configura RLS (Row Level Security)**
5. **Cria políticas de acesso**
6. **Insere dados de exemplo** (se a tabela estiver vazia)

### Passo 3: Verificar Resultados

Após executar o script, você deve ver:

```
✅ Tabela leads criada/corrigida com sucesso!
✅ Políticas RLS configuradas
✅ Índices criados
✅ Dados de exemplo inseridos (se aplicável)
```

## 📊 Estrutura Final da Tabela

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `id` | SERIAL | ID único | ✅ |
| `empresa_id` | UUID | ID da empresa | ✅ |
| `cliente_id` | BIGINT | ID do cliente | ✅ |
| `observacao` | TEXT | Observação do lead | ✅ |
| `created_at` | TIMESTAMP | Data de criação | ✅ |
| `updated_at` | TIMESTAMP | Data de atualização | ✅ |

## 🔐 Políticas RLS Configuradas

- **SELECT**: Usuários podem ver leads da sua empresa
- **INSERT**: Usuários podem inserir leads na sua empresa
- **UPDATE**: Usuários podem atualizar leads da sua empresa
- **DELETE**: Usuários podem excluir leads da sua empresa

## 🧪 Teste no Frontend

Após executar o script:

1. **Recarregue a página** do sistema
2. **Vá para a seção Cotações**
3. **Teste criar um novo lead**:
   - Clique em "Novo Lead" na coluna LEAD
   - Selecione um cliente
   - Adicione uma observação
   - Clique em "Salvar Lead"
4. **Verifique se o lead aparece** na coluna LEAD
5. **Teste converter lead em cotação**:
   - Arraste o lead para a coluna "COTAR"
   - Verifique se a conversão funciona

## 📝 Logs Esperados

No console do navegador, você deve ver:

```
🔍 Buscando leads para empresa: [empresa-id]
✅ Leads carregados do Supabase: [número de leads]
✅ Lead salvo com sucesso: [dados do lead]
```

## 🚨 Troubleshooting

### Se ainda houver erros 400:

1. **Verifique se o script foi executado completamente**
2. **Confirme se as políticas RLS estão ativas**
3. **Verifique se o usuário tem empresa_id válido**
4. **Teste a consulta diretamente no SQL Editor**:

```sql
SELECT * FROM leads 
WHERE empresa_id = '8e23591e-e0af-42f8-a002-6df935bab14a'
ORDER BY created_at DESC;
```

### Se os leads não carregam:

1. **Verifique se há leads na tabela**:
```sql
SELECT COUNT(*) FROM leads;
```

2. **Verifique se há leads para a empresa**:
```sql
SELECT l.*, c.nome as cliente_nome 
FROM leads l 
LEFT JOIN clientes c ON l.cliente_id = c.id 
WHERE l.empresa_id = '8e23591e-e0af-42f8-a002-6df935bab14a';
```

3. **Verifique se o usuário tem acesso à empresa**:
```sql
SELECT * FROM usuarios_empresas 
WHERE usuario_id = auth.uid();
```

### Se houver erro de tipo UUID:

1. **Verifique se o script foi executado completamente**
2. **Confirme que `cliente_id` é BIGINT na tabela**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name = 'cliente_id';
```

3. **Verifique se a tabela `clientes` usa BIGSERIAL**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clientes' 
AND column_name = 'id';
```

## 🎯 Resultado Final

Após a correção:
- ✅ Erros 400 resolvidos
- ✅ Erro de tipo UUID resolvido
- ✅ Sistema de leads funcionando
- ✅ Criação de leads funcionando
- ✅ Conversão lead → cotação funcionando
- ✅ Políticas de segurança configuradas

## 📞 Suporte

Se ainda houver problemas após executar o script, verifique:
1. Logs de erro no console do navegador
2. Logs de erro no Supabase Dashboard
3. Estrutura da tabela no Supabase Table Editor
4. Tipos de dados das colunas `id` nas tabelas `leads` e `clientes` 