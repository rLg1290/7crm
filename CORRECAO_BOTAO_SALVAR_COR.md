# Correção: Botão "Salvar Cor" Não Está Funcionando

## Problema Identificado - FINAL
O botão "Salvar Cor" estava falhando devido a **políticas de RLS (Row Level Security)** no Supabase que impedem o UPDATE na tabela `empresas`.

**Descoberta pelos Logs:**
- ✅ A empresa existe no banco: `📊 Resultado da busca por ID: {data: {...}, error: null}`
- ✅ O comando executa sem erro: `📥 Resposta do update: {data: Array(0), error: null}`
- ❌ Mas nenhuma linha é afetada: `❌ Nenhum registro foi atualizado`

**Causa Raiz:** RLS está bloqueando o UPDATE mesmo com a empresa existindo.

## Possíveis Causas

### 1. Campo `cor_personalizada` não existe no banco
- O campo pode não ter sido criado na tabela `empresas`
- Verificar se o script `adicionar_campo_cor_personalizada.sql` foi executado

### 2. Problema de permissões no Supabase
- RLS (Row Level Security) pode estar bloqueando a atualização
- Verificar políticas de segurança na tabela `empresas`

### 3. Dados da empresa não carregados
- O `empresaInfo.id` pode estar vazio
- Verificar se os metadados do usuário estão corretos

## Soluções

### Passo 1: Verificar e Criar Campo
Execute no SQL Editor do Supabase:

```sql
-- Script seguro para criar o campo se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empresas' AND column_name = 'cor_personalizada'
    ) THEN
        ALTER TABLE empresas ADD COLUMN cor_personalizada VARCHAR(7);
        RAISE NOTICE 'Coluna cor_personalizada criada!';
    ELSE
        RAISE NOTICE 'Coluna cor_personalizada já existe';
    END IF;
END $$;
```

### Passo 2: Verificar Estrutura da Tabela
```sql
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'empresas' 
ORDER BY ordinal_position;
```

### Passo 3: Testar Update Manual
```sql
-- Substitua 'SEU_ID_EMPRESA' pelo ID real da empresa
UPDATE empresas 
SET cor_personalizada = '#FF6B6B' 
WHERE id = 'SEU_ID_EMPRESA';
```

### Passo 4: Verificar RLS (Row Level Security)
```sql
-- Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'empresas';
```

## Debug no Console do Navegador

Adicionamos logs de debug na função `salvarCorPersonalizada`. Abra o console do navegador (F12) e observe:

1. **Logs ao carregar a página:**
   - `🏢 Carregando empresa para usuário`
   - `📥 Dados da empresa carregados`
   - `🎨 Cor personalizada encontrada` ou `🎨 Nenhuma cor personalizada encontrada`

2. **Logs ao clicar em "Salvar Cor":**
   - `🎨 Iniciando salvamento da cor`
   - `📤 Enviando para Supabase`
   - `📥 Resposta do Supabase`
   - `✅ Cor salva com sucesso!` ou `❌ Erro do Supabase`

## Verificações Importantes

1. **Verificar empresa_id do usuário:**
```javascript
// No console do navegador
console.log('User metadata:', JSON.stringify(user.user_metadata, null, 2))
```

2. **Verificar se empresaInfo foi carregado:**
```javascript
console.log('Empresa Info:', empresaInfo)
```

3. **Testar cor personalizada:**
```javascript
console.log('Cor atual:', corPersonalizada)
```

## Arquivos Modificados

### `src/pages/Perfil.tsx`
- Adicionados logs de debug detalhados
- Melhorado tratamento de erros
- Adicionado `.select()` na query de update para verificar retorno

### Scripts SQL Criados
- `verificar_campo_cor.sql` - Verificação manual
- `corrigir_campo_cor_personalizada.sql` - Criação segura do campo

## Próximos Passos - ATUALIZADO

### Passo 1: Executar Script de Verificação
Execute o script `criar_empresa_se_nao_existir.sql` no Supabase:
1. Primeiro execute `SELECT COUNT(*) FROM empresas;` - provavelmente retornará 0
2. Execute `SELECT * FROM empresas;` - provavelmente estará vazia
3. Você precisará criar o registro da empresa manualmente

### Passo 2: Criar Empresa no Banco
1. Clique no botão "🔍 Debug Empresa" na página de Perfil
2. Copie o ID da empresa que aparece no console
3. Execute no Supabase (substitua os valores pelos reais):

```sql
INSERT INTO empresas (
    id, 
    nome, 
    cnpj, 
    codigo_agencia, 
    cor_personalizada,
    created_at
) VALUES (
    'SEU_ID_AQUI',           -- ID que apareceu no console
    '7C Turismo & Consultoria', -- Nome da empresa
    '00.000.000/0001-00',    -- CNPJ real
    '0',                     -- Código da agência
    '#3B82F6',              -- Cor padrão
    NOW()
);
```

### Passo 3: Teste no Navegador
1. Abra http://localhost:5178/
2. Vá para a página de Perfil
3. Abra o console (F12)
4. Clique no botão "🔍 Debug Empresa" para ver os dados
5. Tente salvar uma cor personalizada
6. Observe os logs detalhados no console

### Passo 4: Verificar Logs Específicos
Procure por estes logs no console:
- `🔍 Empresa encontrada:` - Confirma que encontrou a empresa
- `📥 Resposta do update:` - Mostra se o update foi executado
- `🔍 Verificando cor salva:` - Confirma se a cor foi salva
- `🔍 Verificação final:` - Confirma se persistiu no banco

## Resultado Esperado

Após a correção:
- O campo `cor_personalizada` existe na tabela `empresas`
- O botão "Salvar Cor" funciona corretamente
- A cor é salva no banco de dados
- A página pública usa a cor personalizada
- Mensagem de sucesso é exibida ao usuário 