# Solução para Erro RLS nas Promoções - Versão Admin

## 🚨 Problema Identificado

**Erro**: `42710: policy "Empresas podem ver suas promoções" for table "promocoes" already exists`

## 🔍 Nova Abordagem

Baseado no feedback do usuário:
- **Promoções são criadas por administradores**
- **Todas as empresas podem ver todas as promoções**
- **Apenas admins podem criar/editar/deletar promoções**

## ✅ Solução Atualizada

### 1. Execute o Novo Script de Correção

1. Acesse o **SQL Editor** no Supabase
2. Execute o conteúdo do arquivo `corrigir_rls_promocoes_admin.sql`
3. Verifique se as políticas foram criadas corretamente

### 2. Políticas Implementadas

O script criará 4 políticas específicas:

**SELECT** - Todas as empresas podem ver todas as promoções
```sql
CREATE POLICY "Todas empresas podem ver promoções" ON promocoes
    FOR SELECT USING (true);
```

**INSERT** - Apenas admins podem criar promoções
```sql
CREATE POLICY "Admins podem criar promoções" ON promocoes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
```

**UPDATE** - Apenas admins podem atualizar promoções
```sql
CREATE POLICY "Admins podem atualizar promoções" ON promocoes
    FOR UPDATE USING (...) WITH CHECK (...);
```

**DELETE** - Apenas admins podem deletar promoções
```sql
CREATE POLICY "Admins podem deletar promoções" ON promocoes
    FOR DELETE USING (...);
```

## 🔧 Como Funciona a Nova Correção

1. **Remoção Completa**: Remove todas as políticas existentes para evitar conflitos
2. **Acesso Universal**: Todas as empresas podem visualizar todas as promoções
3. **Controle Admin**: Apenas usuários com role 'admin' podem gerenciar promoções
4. **Segurança**: Mantém a segurança através da verificação da role

## 📋 Passos para Implementar

### 1. Executar Script SQL
```bash
# No SQL Editor do Supabase, execute:
# Conteúdo do arquivo: corrigir_rls_promocoes_admin.sql
```

### 2. Verificar Implementação
```sql
-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'promocoes'
ORDER BY policyname;
```

### 3. Testar Funcionalidade
1. **Como usuário comum**: Deve conseguir ver todas as promoções
2. **Como admin**: Deve conseguir criar/editar/deletar promoções
3. **Como usuário comum**: NÃO deve conseguir criar/editar/deletar

## 🎯 Resultado Esperado

Após executar o script:
- ✅ Todas as empresas podem ver todas as promoções
- ✅ Apenas admins podem gerenciar promoções
- ✅ Página de promoções carrega normalmente
- ✅ Sem erros de política duplicada
- ✅ Segurança mantida através de roles

## 🚨 Importante

- **Execute o novo script**: `corrigir_rls_promocoes_admin.sql`
- **NÃO execute o script anterior**: `corrigir_rls_promocoes.sql`
- **Teste com diferentes tipos de usuário**: admin e usuário comum
- **Verifique se a role 'admin' está configurada** na tabela profiles

## 📞 Suporte

Se o erro persistir após executar o script:
1. Verifique se todas as políticas antigas foram removidas
2. Confirme se a tabela `profiles` existe e tem a coluna `role`
3. Verifique se existem usuários com role 'admin'
4. Teste com um usuário admin diferente se necessário

## 📁 Arquivos Relacionados

- `corrigir_rls_promocoes_admin.sql` - Novo script de correção
- `atualizar_estrutura_promocoes.sql` - Atualização da estrutura da tabela
- `7crm-admin/src/pages/Promocoes.tsx` - Página de promoções (já corrigida)

## 🔄 Diferenças da Versão Anterior

| Aspecto | Versão Anterior | Nova Versão |
|---------|----------------|-------------|
| **Visibilidade** | Cada empresa vê suas promoções | Todas empresas veem todas promoções |
| **Criação** | Qualquer empresa pode criar | Apenas admins podem criar |
| **Edição** | Empresa pode editar suas promoções | Apenas admins podem editar |
| **Exclusão** | Empresa pode deletar suas promoções | Apenas admins podem deletar |
| **Controle** | Por empresa_id | Por role de admin |