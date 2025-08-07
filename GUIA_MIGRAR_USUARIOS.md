# 🔄 Guia para Migrar Usuários Existentes

## 🎯 Objetivo
Migrar todos os usuários existentes da tabela `auth.users` para a nova tabela `profiles` e definir suas roles (`user` ou `admin`).

## 📋 Pré-requisitos
- ✅ Tabela `profiles` criada (executar `supabase_profiles_table.sql`)
- ✅ Tabela `empresas` existente
- ✅ Acesso ao SQL Editor do Supabase

## 🚀 Passo a Passo

### 1. Executar Script de Migração

1. **Acesse o Dashboard do Supabase**
   - Vá para [supabase.com](https://supabase.com)
   - Entre no seu projeto
   - Navegue para **SQL Editor**

2. **Execute o Script de Migração**
   - Abra o arquivo `migrar_usuarios_existentes.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em **"Run"**

### 2. Verificar Migração

Após executar o script, você verá:

```sql
-- Resultado esperado:
total_usuarios_migrados | usuarios_com_empresa
------------------------|--------------------
           5            |         3
```

### 3. Definir Administradores

**Opção A: Um Administrador**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

**Opção B: Múltiplos Administradores**
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'admin1@empresa.com',
  'admin2@empresa.com',
  'gerente@empresa.com'
);
```

### 4. Verificar Configuração

```sql
-- Ver todos os usuários e roles
SELECT 
  email,
  role,
  empresa_id,
  created_at
FROM profiles 
ORDER BY role DESC, email;
```

### 5. Testar Sistema Administrativo

1. **Acesse o sistema administrativo**: `http://localhost:3001`
2. **Faça login com um usuário admin**
3. **Verifique se o acesso é liberado**

## 📊 Comandos Úteis

### Gerenciar Roles

```sql
-- Ver estatísticas de roles
SELECT role, COUNT(*) as quantidade 
FROM profiles 
GROUP BY role;

-- Listar apenas administradores
SELECT email, role 
FROM profiles 
WHERE role = 'admin';

-- Listar usuários sem empresa
SELECT email, role 
FROM profiles 
WHERE empresa_id IS NULL;
```

### Modificar Usuários

```sql
-- Tornar usuário administrador
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'usuario@exemplo.com';

-- Remover privilégios de admin
UPDATE profiles 
SET role = 'user' 
WHERE email = 'ex-admin@exemplo.com';

-- Associar usuário a empresa
UPDATE profiles 
SET empresa_id = 'uuid-da-empresa' 
WHERE email = 'usuario@exemplo.com';
```

### Consultas de Verificação

```sql
-- Ver usuários com suas empresas
SELECT 
  p.email,
  p.role,
  e.nome as empresa,
  e.codigo_agencia
FROM profiles p
LEFT JOIN empresas e ON p.empresa_id = e.id
ORDER BY p.role DESC, e.nome;

-- Verificar integridade dos dados
SELECT 
  COUNT(*) as total_auth_users
FROM auth.users;

SELECT 
  COUNT(*) as total_profiles
FROM profiles;

-- Os números devem ser iguais!
```

## 🔍 Identificar Usuários para Admin

### Método 1: Por Email
Se você souber os emails dos administradores:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email IN (
  'dono@empresa.com',
  'gerente@empresa.com'
);
```

### Método 2: Por Data de Criação
Se os primeiros usuários devem ser admins:

```sql
-- Ver usuários por ordem de criação
SELECT email, created_at 
FROM profiles 
ORDER BY created_at 
LIMIT 5;

-- Tornar os 2 primeiros usuários admins
UPDATE profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM profiles 
  ORDER BY created_at 
  LIMIT 2
);
```

### Método 3: Por Empresa
Se usuários de uma empresa específica devem ser admins:

```sql
-- Ver empresas disponíveis
SELECT id, nome, codigo_agencia FROM empresas;

-- Tornar todos os usuários de uma empresa admins
UPDATE profiles 
SET role = 'admin' 
WHERE empresa_id = 'uuid-da-empresa-principal';
```

## ⚠️ Cuidados Importantes

### 1. Backup
```sql
-- Fazer backup antes de modificar
CREATE TABLE profiles_backup AS 
SELECT * FROM profiles;
```

### 2. Verificar Antes de Executar
```sql
-- Sempre verificar quantos registros serão afetados
SELECT COUNT(*) 
FROM profiles 
WHERE email = 'usuario@exemplo.com';

-- Depois executar o UPDATE
```

### 3. Testar Acesso
- ✅ Teste login com usuário admin
- ✅ Teste login com usuário comum
- ✅ Verifique se usuário comum não acessa admin
- ✅ Verifique se admin acessa todas as funcionalidades

## 🎉 Resultado Final

Após seguir este guia:

1. **Todos os usuários existentes** estarão na tabela `profiles`
2. **Roles definidas** (`user` ou `admin`)
3. **Sistema administrativo funcionando** com controle de acesso
4. **Usuários comuns** continuam usando o sistema principal normalmente
5. **Administradores** podem acessar o painel administrativo

## 🔧 Troubleshooting

### Problema: "Nenhum usuário migrado"
**Causa:** Tabela profiles não existe ou script não executado
**Solução:** Execute primeiro `supabase_profiles_table.sql`

### Problema: "Usuário não consegue fazer login no admin"
**Causa:** Role não é 'admin'
**Solução:** 
```sql
SELECT email, role FROM profiles WHERE email = 'usuario@exemplo.com';
UPDATE profiles SET role = 'admin' WHERE email = 'usuario@exemplo.com';
```

### Problema: "Erro de foreign key empresa_id"
**Causa:** empresa_id inválido
**Solução:**
```sql
-- Verificar empresas válidas
SELECT id, nome FROM empresas;

-- Corrigir empresa_id
UPDATE profiles 
SET empresa_id = 'uuid-correto' 
WHERE email = 'usuario@exemplo.com';
```

---

**📞 Suporte:** Se encontrar problemas, verifique os logs do Supabase e as políticas RLS da tabela profiles.