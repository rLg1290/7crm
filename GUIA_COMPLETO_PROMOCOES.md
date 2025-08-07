# 🔧 Guia Completo - Correção da Página de Promoções

## 🚨 Problema

A página de promoções não está abrindo devido a múltiplos problemas:

1. **Incompatibilidade de campos** entre tabela e código TypeScript
2. **Políticas RLS incorretas** na tabela promocoes
3. **Tipos de dados incompatíveis** (UUID vs number)

## ✅ Solução Completa

### Passo 1: Atualizar Estrutura da Tabela

1. Acesse o **SQL Editor** no Supabase
2. Execute o script `atualizar_estrutura_promocoes.sql`

**O que faz:**
- Adiciona campos: `titulo`, `descricao`, `imagem_url`, `data_inicio`, `data_fim`
- Migra dados existentes: `destino` → `titulo`, `observacoes` → `descricao`
- Mantém campos originais para compatibilidade

### Passo 2: Corrigir Políticas RLS

1. No **SQL Editor** do Supabase
2. Execute o script `corrigir_rls_promocoes_admin.sql`

**O que faz:**
- Remove todas as políticas existentes para evitar conflitos
- Cria políticas onde todas as empresas podem ver todas as promoções
- Permite apenas admins criarem/editarem/deletarem promoções
- Mantém segurança através de verificação de role 'admin'

### Passo 3: Corrigir Tipos TypeScript (JÁ FEITO)

✅ **Interfaces atualizadas:**
- `id: number` → `id: string`
- `empresa_id?: number` → `empresa_id?: string`

✅ **Conversões removidas:**
- `parseInt(formData.empresa_id)` → `formData.empresa_id`
- `promocao.empresa_id?.toString()` → `promocao.empresa_id`

## 📋 Scripts para Executar

### 1. atualizar_estrutura_promocoes.sql
```sql
-- Adicionar campos que estão faltando
ALTER TABLE promocoes ADD COLUMN IF NOT EXISTS titulo VARCHAR(255);
ALTER TABLE promocoes ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE promocoes ADD COLUMN IF NOT EXISTS imagem_url TEXT;
ALTER TABLE promocoes ADD COLUMN IF NOT EXISTS data_inicio DATE;
ALTER TABLE promocoes ADD COLUMN IF NOT EXISTS data_fim DATE;

-- Migrar dados existentes
UPDATE promocoes SET titulo = destino WHERE titulo IS NULL;
UPDATE promocoes SET descricao = observacoes WHERE descricao IS NULL;
```

### 2. corrigir_rls_promocoes_admin.sql
```sql
-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Empresas podem ver suas promoções" ON promocoes;
-- ... outras remoções

-- Criar políticas para acesso universal e controle admin
CREATE POLICY "Todas empresas podem ver promoções" ON promocoes
    FOR SELECT USING (true);

CREATE POLICY "Admins podem criar promoções" ON promocoes
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
    );

-- ... outras políticas admin
```

## 🔍 Verificações

### 1. Verificar Estrutura da Tabela
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'promocoes'
ORDER BY ordinal_position;
```

**Resultado esperado:**
- ✅ `titulo` VARCHAR(255)
- ✅ `descricao` TEXT
- ✅ `imagem_url` TEXT
- ✅ `data_inicio` DATE
- ✅ `data_fim` DATE

### 2. Verificar Políticas RLS
```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'promocoes';
```

**Resultado esperado:**
- ✅ 4 políticas criadas (SELECT, INSERT, UPDATE, DELETE)
- ✅ SELECT permite acesso universal (todas empresas veem todas promoções)
- ✅ INSERT/UPDATE/DELETE apenas para admins

### 3. Testar Consulta
```sql
SELECT id, titulo, descricao, empresa_id, ativo
FROM promocoes 
LIMIT 3;
```

## 🎯 Resultado Final

Após executar todos os passos:

- ✅ **Página carrega normalmente**
- ✅ **Campos compatíveis** entre tabela e código
- ✅ **Tipos corretos** (UUID como string)
- ✅ **RLS funcionando** (todas empresas veem todas promoções, apenas admins gerenciam)
- ✅ **CRUD completo** (criar, ler, atualizar, deletar)

## 📁 Arquivos Envolvidos

### Scripts SQL (Execute no Supabase)
1. `atualizar_estrutura_promocoes.sql`
2. `corrigir_rls_promocoes_admin.sql`

### Código TypeScript (JÁ ATUALIZADO)
1. `7crm-admin/src/pages/Promocoes.tsx`
   - Interfaces corrigidas
   - Conversões removidas
   - Tipos compatíveis

### Documentação
1. `SOLUCAO_PAGINA_PROMOCOES.md`
2. `CORRECAO_TIPOS_PROMOCOES.md`
3. `GUIA_COMPLETO_PROMOCOES.md` (este arquivo)

## 🚨 Ordem de Execução

1. **PRIMEIRO**: Execute `atualizar_estrutura_promocoes.sql`
2. **SEGUNDO**: Execute `corrigir_rls_promocoes_admin.sql`
3. **TERCEIRO**: Teste a página de promoções

## 📞 Troubleshooting

Se ainda houver problemas:

1. **Verifique o console do navegador** para erros específicos
2. **Confirme se o usuário tem empresa_id** nos metadados
3. **Teste com usuário diferente** se necessário
4. **Verifique se todos os scripts foram executados** corretamente

## 🎉 Próximos Passos

Após a correção:
1. Teste todas as funcionalidades da página
2. Crie algumas promoções de teste
3. Verifique se todas as empresas conseguem ver todas as promoções
4. Teste se apenas admins conseguem criar/editar/deletar promoções
4. Teste upload de imagens (se implementado)
5. Verifique responsividade da página