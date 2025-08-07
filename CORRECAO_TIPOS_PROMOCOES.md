# 🔧 Correção de Tipos - Interface Promocoes

## 🚨 Problema Adicional Identificado

Além da incompatibilidade de campos, há um problema de **tipos de dados**:

- **Tabela no banco**: `id UUID`, `empresa_id UUID`
- **Interface TypeScript**: `id: number`, `empresa_id?: number`

## ✅ Solução

### Opção 1: Atualizar Interface TypeScript (Recomendado)

Atualizar o arquivo `7crm-admin/src/pages/Promocoes.tsx`:

```typescript
// ANTES (Incorreto)
interface Promocao {
  id: number              // ❌ Deveria ser string
  titulo: string
  descricao: string
  imagem_url?: string
  data_inicio: string
  data_fim: string
  ativo: boolean
  empresa_id?: number     // ❌ Deveria ser string
  empresa?: {
    nome: string
    codigo_agencia: string
  }
  created_at: string
}

interface Empresa {
  id: number              // ❌ Deveria ser string
  nome: string
  codigo_agencia: string
}

// DEPOIS (Correto)
interface Promocao {
  id: string              // ✅ UUID como string
  titulo: string
  descricao: string
  imagem_url?: string
  data_inicio: string
  data_fim: string
  ativo: boolean
  empresa_id?: string     // ✅ UUID como string
  empresa?: {
    nome: string
    codigo_agencia: string
  }
  created_at: string
}

interface Empresa {
  id: string              // ✅ UUID como string
  nome: string
  codigo_agencia: string
}
```

### Opção 2: Converter Tabela para Integer (Não Recomendado)

Esta opção não é recomendada pois:
- UUID é mais seguro
- UUID evita conflitos
- UUID é padrão do Supabase
- Outras tabelas já usam UUID

## 📋 Passos para Implementar

### 1. Atualizar Interface TypeScript

1. Abra o arquivo `7crm-admin/src/pages/Promocoes.tsx`
2. Localize as interfaces `Promocao` e `Empresa`
3. Altere `id: number` para `id: string`
4. Altere `empresa_id?: number` para `empresa_id?: string`

### 2. Atualizar Código de Conversão

No método `handleSubmit`, remova a conversão para integer:

```typescript
// ANTES (Incorreto)
const promocaoData = {
  titulo: formData.titulo,
  descricao: formData.descricao,
  imagem_url: formData.imagem_url || null,
  data_inicio: formData.data_inicio,
  data_fim: formData.data_fim,
  ativo: formData.ativo,
  empresa_id: formData.empresa_id ? parseInt(formData.empresa_id) : null  // ❌ Remove parseInt
}

// DEPOIS (Correto)
const promocaoData = {
  titulo: formData.titulo,
  descricao: formData.descricao,
  imagem_url: formData.imagem_url || null,
  data_inicio: formData.data_inicio,
  data_fim: formData.data_fim,
  ativo: formData.ativo,
  empresa_id: formData.empresa_id || null  // ✅ Sem conversão
}
```

### 3. Atualizar Estado do Formulário

No método `handleEdit`, remova a conversão toString:

```typescript
// ANTES (Incorreto)
setFormData({
  titulo: promocao.titulo,
  descricao: promocao.descricao,
  imagem_url: promocao.imagem_url || '',
  data_inicio: promocao.data_inicio,
  data_fim: promocao.data_fim,
  ativo: promocao.ativo,
  empresa_id: promocao.empresa_id?.toString() || ''  // ❌ Remove toString
})

// DEPOIS (Correto)
setFormData({
  titulo: promocao.titulo,
  descricao: promocao.descricao,
  imagem_url: promocao.imagem_url || '',
  data_inicio: promocao.data_inicio,
  data_fim: promocao.data_fim,
  ativo: promocao.ativo,
  empresa_id: promocao.empresa_id || ''  // ✅ Sem conversão
})
```

## 🎯 Resultado Esperado

Após as correções:
- ✅ Tipos TypeScript compatíveis com banco
- ✅ Sem erros de conversão de tipos
- ✅ Código mais limpo e consistente
- ✅ Melhor performance (sem conversões desnecessárias)

## 📁 Arquivos a Serem Modificados

1. `7crm-admin/src/pages/Promocoes.tsx`
   - Interfaces `Promocao` e `Empresa`
   - Método `handleSubmit`
   - Método `handleEdit`

## 🚨 Importante

- Execute primeiro os scripts SQL (`atualizar_estrutura_promocoes.sql` e `corrigir_rls_promocoes.sql`)
- Depois faça as correções no código TypeScript
- Teste todas as funcionalidades após as mudanças