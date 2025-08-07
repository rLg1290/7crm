# 🔧 Solução para Problema de Login no Sistema Administrativo

## 🚨 Problema Identificado

O sistema administrativo não consegue fazer login porque:

1. **Código estava verificando local errado**: O código original verificava `user_metadata.role` mas a role está armazenada na tabela `profiles`
2. **Políticas RLS restritivas**: As políticas da tabela `profiles` impediam a consulta durante o processo de autenticação

## ✅ Soluções Implementadas

### 1. Correção do Código de Login

**Arquivo corrigido**: `7crm-admin/src/components/LoginPage.tsx`

**Mudança**: Agora o sistema consulta a tabela `profiles` para verificar a role:

```typescript
// ANTES (INCORRETO)
if (data.user && data.user.user_metadata?.role !== 'admin') {

// DEPOIS (CORRETO)
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', data.user.id)
  .single()

if (profileError || !profile || profile.role !== 'admin') {
```

### 2. Correção das Políticas RLS

**Arquivo criado**: `corrigir_politicas_profiles.sql`

**Problema**: Políticas muito restritivas impediam consulta durante autenticação
**Solução**: Nova política que permite leitura durante o processo de login

## 🔨 Passos para Resolver

### Passo 1: Executar Script de Correção

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o arquivo `corrigir_politicas_profiles.sql`:

```sql
-- Remover políticas conflitantes
DROP POLICY IF EXISTS "Usuários podem ver apenas seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Permitir leitura de perfil durante autenticação" ON profiles;
DROP POLICY IF EXISTS "Leitura de perfis" ON profiles;

-- Criar política correta
CREATE POLICY "Leitura de perfis" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR
    auth.uid() IS NULL
  );
```

### Passo 2: Verificar se Usuário tem Role Admin

```sql
-- Verificar seu usuário na tabela profiles
SELECT id, email, role FROM profiles WHERE email = 'seu-email@exemplo.com';

-- Se não existir, criar o perfil
INSERT INTO profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users 
WHERE email = 'seu-email@exemplo.com'
AND id NOT IN (SELECT id FROM profiles);

-- Se existir mas não for admin, atualizar
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

### Passo 3: Testar o Login

1. Navegue até o diretório do sistema admin:
   ```bash
   cd 7crm-admin
   ```

2. Instale as dependências (se ainda não fez):
   ```bash
   npm install
   ```

3. Configure o arquivo `.env` (copie de `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Preencha as credenciais do Supabase no `.env`:
   ```
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

5. Execute o sistema:
   ```bash
   npm run dev
   ```

6. Acesse `http://localhost:3001` e tente fazer login

## 🧪 Verificações

### Verificar Políticas
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';
```

### Verificar Usuários Admin
```sql
SELECT p.email, p.role, u.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';
```

### Testar Consulta de Perfil
```sql
-- Deve retornar dados sem erro
SELECT id, email, role FROM profiles LIMIT 5;
```

## 🚨 Troubleshooting

### Erro: "permission denied for table profiles"
**Solução**: Execute o script `corrigir_politicas_profiles.sql`

### Erro: "Acesso negado. Este sistema é exclusivo para administradores"
**Solução**: Verifique se seu usuário tem `role = 'admin'` na tabela profiles

### Erro: "relation 'profiles' does not exist"
**Solução**: Execute primeiro o script `supabase_profiles_table.sql`

### Login funciona mas não carrega dados
**Solução**: Verifique se as outras tabelas (empresas, usuarios, promocoes) existem e têm dados

## 📋 Checklist Final

- [ ] Script `corrigir_politicas_profiles.sql` executado
- [ ] Usuário tem role 'admin' na tabela profiles
- [ ] Arquivo `.env` configurado corretamente
- [ ] Sistema administrativo rodando em `http://localhost:3001`
- [ ] Login funcionando sem erros
- [ ] Dashboard carregando dados corretamente

## 🎯 Resultado Esperado

Após seguir todos os passos:
1. ✅ Login no sistema administrativo funcionando
2. ✅ Verificação de role admin funcionando
3. ✅ Dashboard carregando dados
4. ✅ Todas as páginas administrativas acessíveis

---

**Nota**: Se ainda houver problemas, verifique o console do navegador (F12) para mensagens de erro específicas.