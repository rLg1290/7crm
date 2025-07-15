# 🔧 Solução do Erro 400 na Criação de Tarefas

## ❌ Problema Identificado

O sistema estava apresentando erro **400 (Bad Request)** ao tentar criar tarefas de check-in automaticamente quando uma venda era lançada. O erro ocorria porque:

### 1. **Campos Incorretos na Inserção**
O código estava tentando inserir campos que não existem na tabela `tarefas`:
- ❌ `tipo: 'LEMBRETE'` - Campo não existe na tabela
- ❌ `lead_id` - Campo não existe na tabela atual
- ❌ `status: 'PENDENTE'` - Valor incorreto (deve ser 'pendente')
- ❌ `prioridade: 'MEDIA'` - Valor incorreto (deve ser 'media')
- ❌ `categoria: 'Check-in'` - Valor incorreto (deve ser 'viagem')

### 2. **Campos Obrigatórios Faltando**
A tabela `tarefas` exige campos obrigatórios que não estavam sendo enviados:
- ❌ `usuario_id` - Campo obrigatório para RLS
- ❌ `notificacoes` - Campo obrigatório

### 3. **Políticas RLS Incorretas**
As políticas de Row Level Security estavam usando referências incorretas aos metadados do usuário.

## ✅ Solução Implementada

### 1. **Correção dos Campos na Inserção**

**Antes:**
```typescript
await supabase.from('tarefas').insert({
  titulo,
  descricao,
  tipo: 'LEMBRETE',           // ❌ Campo inexistente
  data_vencimento,
  hora_vencimento,
  status: 'PENDENTE',         // ❌ Valor incorreto
  prioridade: 'MEDIA',        // ❌ Valor incorreto
  empresa_id,
  cliente: clienteNome,
  categoria: 'Check-in',      // ❌ Valor incorreto
});
```

**Depois:**
```typescript
const { error: tarefaError } = await supabase.from('tarefas').insert({
  titulo,
  descricao,
  data_vencimento,
  hora_vencimento,
  status: 'pendente',         // ✅ Valor correto
  prioridade: 'media',        // ✅ Valor correto
  responsavel: 'Sistema',     // ✅ Campo obrigatório
  categoria: 'viagem',        // ✅ Valor correto
  empresa_id,
  usuario_id: user?.id,       // ✅ Campo obrigatório para RLS
  cliente: clienteNome,
  notificacoes: true          // ✅ Campo obrigatório
});
```

### 2. **Correção da Função salvarTarefa**

**Antes:**
```typescript
.insert([{
  // ... outros campos
  lead_id: leadSelecionado.id,  // ❌ Campo inexistente
  empresa_id: user?.user_metadata?.empresa_id
}])
```

**Depois:**
```typescript
.insert([{
  // ... outros campos
  empresa_id: user?.user_metadata?.empresa_id,
  usuario_id: user?.id,         // ✅ Campo obrigatório
  notificacoes: true            // ✅ Campo obrigatório
}])
```

### 3. **Script SQL para Correção da Estrutura**

Foi criado o arquivo `corrigir_rls_tarefas.sql` que:
- Remove políticas RLS antigas e incorretas
- Cria novas políticas que usam `user_metadata` corretamente
- Adiciona colunas faltantes (`usuario_id`, `notificacoes`)
- Remove colunas obsoletas (`lead_id`, `tipo`)
- Verifica a estrutura final da tabela

## 🚀 Como Aplicar a Correção

### 1. **Execute o Script SQL**
1. Acesse o Supabase Dashboard
2. Vá para o SQL Editor
3. Execute o arquivo `corrigir_rls_tarefas.sql`

### 2. **Verifique os Logs**
Após a correção, ao lançar uma venda, você deve ver no console:
```
✅ Tarefa de check-in criada com sucesso para voo: ABC123
```

### 3. **Teste a Funcionalidade**
1. Crie uma cotação com voos
2. Configure localizadores nos voos
3. Lance a venda
4. Verifique se as tarefas de check-in foram criadas no calendário

## 📋 Estrutura Correta da Tabela Tarefas

```sql
CREATE TABLE tarefas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  prioridade VARCHAR(10) CHECK (prioridade IN ('alta', 'media', 'baixa')) DEFAULT 'media',
  status VARCHAR(20) CHECK (status IN ('pendente', 'em-andamento', 'concluida', 'cancelada')) DEFAULT 'pendente',
  data_vencimento DATE NOT NULL,
  hora_vencimento TIME,
  responsavel VARCHAR(255) NOT NULL,
  categoria VARCHAR(20) CHECK (categoria IN ('vendas', 'atendimento', 'administrativo', 'reuniao', 'viagem')) DEFAULT 'vendas',
  cliente VARCHAR(255),
  notificacoes BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎯 Resultado Esperado

Após aplicar as correções:
- ✅ Tarefas de check-in são criadas automaticamente ao lançar vendas
- ✅ Não há mais erros 400 no console
- ✅ As tarefas aparecem corretamente no calendário
- ✅ As políticas RLS funcionam corretamente
- ✅ Todos os campos obrigatórios são preenchidos

## 🔍 Monitoramento

Para verificar se tudo está funcionando:
1. Abra o Console do navegador (F12)
2. Lance uma venda
3. Procure por mensagens de sucesso:
   ```
   ✅ Tarefa de check-in criada com sucesso para voo: [LOCALIZADOR]
   ```
4. Verifique se não há mais erros 400 