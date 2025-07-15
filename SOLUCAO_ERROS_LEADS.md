# Solução para Erros de Leads

## 🔧 SQL Corrigido

Execute este SQL no Supabase (corrigido para usar BIGINT):

```sql
-- Criar tabela leads
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  cliente_id BIGINT REFERENCES clientes(id) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Política de acesso
CREATE POLICY "Permitir acesso total aos leads" ON leads
  FOR ALL USING (true);
```

## 🐛 Erro de Linter - Declarações Duplicadas

O arquivo `src/pages/Cotacoes.tsx` tem declarações duplicadas de estados. Para corrigir:

### 1. Remover linhas duplicadas (linhas 338-345):

```typescript
// REMOVER estas linhas duplicadas:
const [loading, setLoading] = useState(false)
const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
const [clientes, setClientes] = useState<Cliente[]>([])
const [loadingClientes, setLoadingClientes] = useState(false)
const [buscaCliente, setBuscaCliente] = useState('')
const [abaAtiva, setAbaAtiva] = useState<'VOOS' | 'HOTEIS' | 'SERVICOS' | 'PASSAGEIROS' | 'VENDA'>('VOOS')
```

### 2. Manter apenas as declarações originais (linhas 116-122)

## 📝 Passos para Resolver

1. **Execute o SQL corrigido** no Supabase
2. **Abra o arquivo** `src/pages/Cotacoes.tsx`
3. **Localize as linhas 338-345** e **DELETE** essas linhas duplicadas
4. **Salve o arquivo**
5. **Reinicie o servidor** se necessário

## ✅ Resultado Esperado

Após as correções:
- ✅ Tabela `leads` criada no Supabase
- ✅ Erros de linter resolvidos
- ✅ Sistema de leads funcionando
- ✅ Conversão lead → cotação funcionando

## 🎯 Teste Final

1. Crie um lead na coluna LEAD
2. Arraste para "COTAR"
3. Verifique se a conversão funciona
4. Confirme que não há mais erros no console 