# 🔧 Adicionar Campo empresa_id à Tabela Leads

## 🚨 Problema Identificado

A tabela `leads` não tem o campo `empresa_id`, mas o sistema está tentando filtrar por empresa. Isso causa:

1. **Leads não aparecem** no sistema
2. **Erro 400** ao tentar carregar leads
3. **Filtro por empresa** não funciona

## 🔍 Causa do Problema

O código do frontend está tentando filtrar leads por `empresa_id`:

```typescript
const { data, error } = await supabase
  .from('leads')
  .select(`*, cliente:clientes(*)`)
  .eq('empresa_id', empresaId) // ← Este campo não existe na tabela!
  .order('created_at', { ascending: false })
```

Mas a tabela `leads` atual não tem este campo.

## ✅ Solução

### Passo 1: Executar Script de Correção

1. **Acesse o Supabase Dashboard**
2. **Vá para SQL Editor**
3. **Cole o conteúdo do arquivo `adicionar_empresa_id_leads.sql`**
4. **Execute o script**

### Passo 2: O que o Script Faz

1. **Verifica a estrutura atual** da tabela `leads`
2. **Mostra os dados existentes** na tabela
3. **Adiciona o campo `empresa_id`** (UUID)
4. **Atualiza leads existentes** com `empresa_id` baseado no cliente
5. **Adiciona foreign key constraint** para `empresas(id)`
6. **Cria índice** para melhor performance
7. **Configura políticas RLS** para segurança
8. **Mostra resultado final** com estatísticas

### Passo 3: Verificar Resultados

Após executar o script, você deve ver:

```
✅ Campo empresa_id adicionado com sucesso!
✅ Leads existentes atualizados com empresa_id
✅ Foreign key constraint adicionada
✅ Índice criado
✅ Políticas RLS configuradas
```

## 📊 Estrutura Final da Tabela

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `id` | SERIAL | ID único | ✅ |
| `cliente_id` | BIGINT | ID do cliente | ✅ |
| `observacao` | TEXT | Observação do lead | ✅ |
| `empresa_id` | UUID | ID da empresa | ✅ |
| `created_at` | TIMESTAMP | Data de criação | ✅ |

## 🔐 Políticas RLS Configuradas

- **SELECT**: Usuários podem ver leads da sua empresa
- **INSERT**: Usuários podem inserir leads na sua empresa
- **UPDATE**: Usuários podem atualizar leads da sua empresa
- **DELETE**: Usuários podem excluir leads da sua empresa

## 🧪 Teste no Frontend

Após executar o script:

1. **Recarregue a página** do sistema
2. **Vá para a seção Cotações**
3. **Verifique se os leads aparecem** na coluna LEAD
4. **Teste criar um novo lead**:
   - Clique em "Novo Lead"
   - Selecione um cliente
   - Adicione observação
   - Salve o lead
5. **Verifique se o lead aparece** na coluna LEAD

## 📝 Logs Esperados

No console do navegador, você deve ver:

```
🔍 Buscando leads para empresa: [empresa-id]
✅ Leads carregados do Supabase: [número de leads]
```

## 🚨 Troubleshooting

### Se os leads ainda não aparecem:

1. **Verifique se o script foi executado completamente**
2. **Confirme se há leads com empresa_id**:
```sql
SELECT COUNT(*) as total_leads,
       COUNT(CASE WHEN empresa_id IS NOT NULL THEN 1 END) as com_empresa
FROM leads;
```

3. **Verifique se o usuário tem empresa_id válido**:
```sql
SELECT empresa_id FROM usuarios_empresas 
WHERE usuario_id = auth.uid();
```

4. **Teste a consulta diretamente**:
```sql
SELECT l.*, c.nome as cliente_nome 
FROM leads l 
LEFT JOIN clientes c ON l.cliente_id = c.id 
WHERE l.empresa_id = '8e23591e-e0af-42f8-a002-6df935bab14a'
ORDER BY l.created_at DESC;
```

### Se há leads sem empresa_id:

1. **Verifique se os clientes têm empresa_id**:
```sql
SELECT c.id, c.nome, c.empresa_id 
FROM clientes c 
WHERE c.id IN (SELECT DISTINCT cliente_id FROM leads WHERE empresa_id IS NULL);
```

2. **Atualize manualmente se necessário**:
```sql
UPDATE leads 
SET empresa_id = (
    SELECT c.empresa_id 
    FROM clientes c 
    WHERE c.id = leads.cliente_id 
    LIMIT 1
)
WHERE empresa_id IS NULL;
```

## 🎯 Resultado Final

Após a correção:
- ✅ Campo `empresa_id` adicionado à tabela `leads`
- ✅ Leads existentes atualizados com empresa_id
- ✅ Sistema de leads funcionando
- ✅ Filtro por empresa funcionando
- ✅ Políticas de segurança configuradas

## 📞 Suporte

Se ainda houver problemas após executar o script, verifique:
1. Logs de erro no console do navegador
2. Logs de erro no Supabase Dashboard
3. Estrutura da tabela no Supabase Table Editor
4. Dados dos leads e clientes para confirmar empresa_id 