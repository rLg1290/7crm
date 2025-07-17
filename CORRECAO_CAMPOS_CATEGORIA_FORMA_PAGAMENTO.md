# Correção dos Campos Categoria e Forma de Pagamento

## Problema Identificado
O erro ocorria porque o código estava tentando salvar os **nomes** das categorias e formas de pagamento, quando deveria estar salvando os **IDs** desses campos.

### Erro Original
```
"Could not find the 'categoria' column of 'contas_pagar' in the schema cache"
```

## Solução Implementada

### 1. Correção dos Selects
**Arquivo**: `src/pages/Financeiro.tsx`

#### Antes:
```tsx
<option key={categoria.id} value={categoria.nome}>
  📋 {categoria.nome}
</option>
```

#### Depois:
```tsx
<option key={categoria.id} value={categoria.id}>
  📋 {categoria.nome}
</option>
```

### 2. Atualização das Interfaces TypeScript
**Arquivo**: `src/services/financeiroService.ts`

#### Interface ContasPagar:
```typescript
// Antes
export interface ContasPagar {
  categoria: string
  forma_pagamento?: string | number | null;
  // ...
}

// Depois
export interface ContasPagar {
  categoria: number
  forma_pagamento?: number | null;
  // ...
}
```

#### Interface NovaContaPagar:
```typescript
// Antes
export interface NovaContaPagar {
  categoria: string
  forma_pagamento: string
  // ...
}

// Depois
export interface NovaContaPagar {
  categoria: number
  forma_pagamento: number
  // ...
}
```

### 3. Atualização do Estado Inicial
**Arquivo**: `src/pages/Financeiro.tsx`

#### Antes:
```typescript
const [novaContaPagar, setNovaContaPagar] = useState({
  categoria: '',
  forma_pagamento: '',
  // ...
})
```

#### Depois:
```typescript
const [novaContaPagar, setNovaContaPagar] = useState({
  categoria: 0,
  forma_pagamento: 0,
  // ...
})
```

### 4. Correção dos Event Handlers
**Arquivo**: `src/pages/Financeiro.tsx`

#### Antes:
```tsx
onChange={(e) => setNovaContaPagar(prev => ({ ...prev, categoria: e.target.value }))}
onChange={(e) => setNovaContaPagar(prev => ({ ...prev, forma_pagamento: e.target.value }))}
```

#### Depois:
```tsx
onChange={(e) => setNovaContaPagar(prev => ({ ...prev, categoria: parseInt(e.target.value) || 0 }))}
onChange={(e) => setNovaContaPagar(prev => ({ ...prev, forma_pagamento: parseInt(e.target.value) || 0 }))}
```

### 5. Atualização das Validações
**Arquivo**: `src/pages/Financeiro.tsx`

#### Antes:
```typescript
if (!novaContaPagar.categoria || !novaContaPagar.forma_pagamento || ...) {
  // validação
}
```

#### Depois:
```typescript
if (novaContaPagar.categoria <= 0 || novaContaPagar.forma_pagamento <= 0 || ...) {
  // validação
}
```

## Estrutura da Tabela contas_pagar

A tabela `contas_pagar` agora espera:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `categoria` | INTEGER | ID da categoria (referência à tabela categorias) |
| `forma_pagamento` | INTEGER | ID da forma de pagamento (referência à tabela formas_pagamento) |
| `fornecedor_id` | INTEGER | ID do fornecedor (referência à tabela fornecedores) |

## Teste da Correção

### 1. Recarregue a Página
- Recarregue a página do Financeiro no navegador

### 2. Teste a Criação de Conta
1. Clique em "Adicionar Conta a Pagar"
2. Selecione uma categoria (agora salva o ID)
3. Selecione uma forma de pagamento (agora salva o ID)
4. Preencha os outros campos
5. Clique em "Salvar"

### 3. Logs Esperados
```
✅ Antes da correção:
POST https://.../rest/v1/contas_pagar?select=* 400 (Bad Request)
"Could not find the 'categoria' column of 'contas_pagar' in the schema cache"

✅ Após a correção:
POST https://.../rest/v1/contas_pagar?select=* 201 (Created)
financeiroService.ts:271 Conta a pagar criada com sucesso: {...}
```

## Verificação no Banco

Após salvar com sucesso, verifique no Supabase:

```sql
-- Verificar a conta criada
SELECT 
  cp.id,
  cp.categoria,
  c.nome as categoria_nome,
  cp.forma_pagamento,
  fp.nome as forma_pagamento_nome,
  cp.valor,
  cp.vencimento
FROM contas_pagar cp
LEFT JOIN categorias c ON cp.categoria = c.id
LEFT JOIN formas_pagamento fp ON cp.forma_pagamento = fp.id
ORDER BY cp.created_at DESC
LIMIT 5;
```

## Benefícios da Correção

1. **Integridade Referencial**: Agora os campos são IDs que referenciam as tabelas corretas
2. **Consistência**: Dados consistentes entre frontend e backend
3. **Performance**: Consultas mais eficientes usando IDs
4. **Manutenibilidade**: Código mais limpo e tipado corretamente

---

**Status**: ✅ Correção implementada
**Data**: $(date)
**Impacto**: 🔴 ALTO - Resolve erro 400 ao criar contas a pagar 