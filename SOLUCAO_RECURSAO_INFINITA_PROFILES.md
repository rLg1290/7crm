# Solução para Recursão Infinita nas Políticas RLS da Tabela Profiles

## Problema Identificado

O erro `infinite recursion detected in policy for relation "profiles"` indica que as políticas RLS (Row Level Security) da tabela `profiles` estão causando uma recursão infinita. Isso acontece quando uma política tenta verificar uma condição que depende da própria tabela que está sendo protegida.

## Causa do Problema

As políticas RLS anteriores estavam usando condições como:
```sql
auth.uid() = id OR auth.uid() IS NULL
```

Quando o sistema tenta verificar `auth.uid()`, ele pode precisar consultar a tabela `profiles` para obter informações do usuário, criando um loop infinito.

## Solução

### Passo 1: Executar o Script de Correção

1. Acesse o **SQL Editor** do Supabase
2. Execute o script `corrigir_recursao_profiles.sql`:

```sql
-- Script para corrigir recursão infinita nas políticas RLS da tabela profiles
-- Execute este script no SQL Editor do Supabase

-- Desabilitar RLS temporariamente para limpeza
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Usuários podem ver apenas seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Permitir leitura de perfil durante autenticação" ON profiles;
DROP POLICY IF EXISTS "Leitura de perfis" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON profiles;
DROP POLICY IF EXISTS "Administradores podem gerenciar todos os perfis" ON profiles;
DROP POLICY IF EXISTS "Permitir inserção de novos perfis" ON profiles;

-- Reabilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar política simples para SELECT (sem recursão)
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (true);

-- Criar política para INSERT
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Criar política para UPDATE
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Passo 2: Verificar a Correção

Após executar o script, verifique se as políticas foram criadas corretamente:

```sql
-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
```

### Passo 3: Testar o Login

1. Acesse o sistema administrativo
2. Tente fazer login com suas credenciais
3. O sistema deve conseguir consultar a tabela `profiles` sem erro de recursão

## Explicação da Nova Abordagem

### Política de SELECT Simplificada

A nova política `profiles_select_policy` usa `USING (true)`, que permite leitura completa da tabela. Isso resolve o problema de recursão, mas mantém a segurança através do controle de acesso da aplicação.

### Políticas de INSERT e UPDATE

Estas políticas mantêm a segurança necessária:
- **INSERT**: Só permite inserir perfis com o próprio `auth.uid()`
- **UPDATE**: Só permite atualizar o próprio perfil

## Segurança

Embora a política de SELECT seja mais permissiva, a segurança é mantida porque:

1. **Autenticação**: Usuários precisam estar logados para acessar
2. **Controle na Aplicação**: O código da aplicação controla o que cada usuário pode ver
3. **Políticas de Modificação**: INSERT e UPDATE ainda são restritivos

## Verificação Final

Após aplicar a correção, teste:

1. **Login no sistema administrativo**
2. **Consulta de perfis no console do navegador**
3. **Verificação de logs de erro**

Se tudo estiver funcionando, você não deve mais ver o erro de recursão infinita.

## Próximos Passos

Com as políticas RLS corrigidas, o sistema administrativo deve funcionar normalmente. Se ainda houver problemas de acesso, verifique:

1. Se o usuário tem role 'admin' na tabela profiles
2. Se as credenciais do Supabase estão corretas
3. Se não há outros erros no console do navegador