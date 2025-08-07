# 🔐 Configuração de Roles no Supabase

## 🎯 Problema Identificado

O sistema administrativo `7crm-admin` precisa de uma tabela `profiles` com a coluna `role` para diferenciar usuários comuns (`user`) de administradores (`admin`). Atualmente, o Supabase só possui a tabela de autenticação padrão (`auth.users`).

## 🚀 Solução Implementada

### 1. Criar Tabela Profiles

Execute o script SQL no **SQL Editor** do Supabase:

```bash
# Arquivo criado: supabase_profiles_table.sql
```

**Passos:**
1. Acesse o [Dashboard do Supabase](https://supabase.com)
2. Entre no seu projeto
3. Navegue para **SQL Editor**
4. Copie todo o conteúdo do arquivo `supabase_profiles_table.sql`
5. Cole no SQL Editor
6. Clique em **"Run"** para executar

### 2. Estrutura da Tabela Profiles

```sql
profiles (
  id UUID PRIMARY KEY,           -- Referência ao auth.users(id)
  email VARCHAR(255) NOT NULL,    -- Email do usuário
  role VARCHAR(20) DEFAULT 'user', -- 'user' ou 'admin'
  empresa_id UUID,                -- Referência à empresa (opcional)
  created_at TIMESTAMP,           -- Data de criação
  updated_at TIMESTAMP,           -- Data de atualização
  last_sign_in_at TIMESTAMP       -- Último login
)
```

### 3. Funcionalidades Implementadas

#### 🔄 **Criação Automática de Perfis**
- Trigger que cria perfil automaticamente quando usuário se registra
- Extrai `role` e `empresa_id` dos metadados do usuário
- Role padrão: `'user'`

#### 🛡️ **Políticas de Segurança (RLS)**
- Usuários só veem seu próprio perfil
- Usuários só podem atualizar seu próprio perfil
- Administradores podem gerenciar todos os perfis
- Controle de inserção baseado em roles

#### 🔧 **Triggers Automáticos**
- Criação de perfil ao registrar usuário
- Atualização automática do campo `updated_at`

## 🔨 Configuração Pós-Instalação

### 1. Migrar Usuários Existentes

Se você já tem usuários no sistema, execute este comando **UMA ÚNICA VEZ**:

```sql
-- Descomente e execute no SQL Editor
INSERT INTO profiles (id, email, role, empresa_id)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'role', 'user') as role,
  CASE 
    WHEN raw_user_meta_data->>'empresa_id' IS NOT NULL 
    THEN (raw_user_meta_data->>'empresa_id')::UUID
    ELSE NULL
  END as empresa_id
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

### 2. Criar Primeiro Administrador

**Opção A: Via Interface do Supabase**
1. Vá para **Authentication > Users**
2. Crie um novo usuário ou use um existente
3. No **SQL Editor**, execute:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'seu-email@exemplo.com';
```

**Opção B: Via Código (Recomendado)**
1. Registre-se normalmente no sistema
2. Execute o comando SQL acima para tornar-se admin

### 3. Verificar Configuração

Teste se tudo está funcionando:

```sql
-- Verificar se tabela foi criada
SELECT * FROM profiles LIMIT 5;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';
```

## 🔄 Atualização do Sistema Principal

### 1. Modificar Políticas Existentes

Algumas tabelas podem precisar de ajustes nas políticas RLS:

```sql
-- Exemplo: Atualizar política de clientes para usar profiles
DROP POLICY IF EXISTS "Usuários podem ver apenas clientes da própria empresa" ON clientes;

CREATE POLICY "Usuários podem ver apenas clientes da própria empresa" ON clientes
  FOR ALL USING (
    empresa_id = (
      SELECT empresa_id FROM profiles 
      WHERE id = auth.uid()
    )
  );
```

### 2. Atualizar Código Frontend

O sistema já está preparado para usar a tabela `profiles`. Certifique-se de que:

- ✅ Sistema principal (`7crm`) funciona normalmente
- ✅ Sistema administrativo (`7crm-admin`) acessa roles corretamente
- ✅ Autenticação verifica roles adequadamente

## 🧪 Testes

### 1. Teste de Criação de Usuário

```javascript
// No sistema principal, registre um novo usuário
const { data, error } = await supabase.auth.signUp({
  email: 'teste@exemplo.com',
  password: 'senha123',
  options: {
    data: {
      role: 'user',
      empresa_id: 1
    }
  }
})

// Verifique se o perfil foi criado automaticamente
```

### 2. Teste de Acesso Admin

```javascript
// No sistema administrativo, faça login com admin
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@exemplo.com',
  password: 'senha123'
})

// Verifique se o acesso é liberado
```

### 3. Teste de Políticas

```sql
-- Como usuário comum, deve ver apenas seu perfil
SELECT * FROM profiles; -- Deve retornar apenas 1 registro

-- Como admin, deve ver todos os perfis
SELECT * FROM profiles; -- Deve retornar todos os registros
```

## 🚨 Troubleshooting

### Problema: "relation 'profiles' does not exist"
**Solução:** Execute o script `supabase_profiles_table.sql` no SQL Editor

### Problema: "permission denied for table profiles"
**Solução:** Verifique se as políticas RLS foram criadas corretamente

### Problema: "foreign key constraint cannot be implemented"
**Solução:** Erro de tipo de dados corrigido - empresa_id agora é UUID (compatível com empresas.id)

### Problema: "Acesso negado no sistema admin"
**Solução:** Verifique se o usuário tem `role = 'admin'` na tabela profiles

### Problema: Perfil não criado automaticamente
**Solução:** Verifique se o trigger `on_auth_user_created` existe

## 📋 Checklist Final

- [ ] Script SQL executado com sucesso
- [ ] Tabela `profiles` criada
- [ ] Políticas RLS ativas
- [ ] Triggers funcionando
- [ ] Usuários existentes migrados
- [ ] Primeiro admin criado
- [ ] Sistema principal funcionando
- [ ] Sistema administrativo funcionando
- [ ] Testes de acesso realizados

## 🎉 Resultado Final

Após seguir estas instruções:

1. **Sistema Principal (`7crm`)**: Continua funcionando normalmente
2. **Sistema Administrativo (`7crm-admin`)**: Funciona com controle de roles
3. **Segurança**: Usuários comuns não acessam área administrativa
4. **Escalabilidade**: Fácil adicionar novos roles no futuro

---

**⚠️ Importante:** Sempre faça backup do banco antes de executar scripts SQL em produção!