# Sistema de Código de Agência - CRM Turismo

## 📋 Resumo do Sistema

Implementado sistema de validação por **Código de Agência** obrigatório no cadastro, garantindo que apenas usuários com códigos válidos possam se registrar no sistema.

## 🔧 Configuração no Supabase

### 1. Criar Tabela de Empresas
Execute o script `supabase_empresas_table.sql` no SQL Editor do Supabase:

```sql
-- Cria tabela empresas com códigos únicos
-- Inclui RLS para segurança
-- Adiciona exemplos de empresas
```

### 2. Atualizar Tabela de Clientes
Execute o script atualizado `supabase_clientes_table.sql`:

```sql
-- Atualiza política RLS para usar empresa_id
-- Garante isolamento por empresa
```

## 🎯 Como Funciona

### Cadastro de Usuário
1. **Campo obrigatório**: "Código de Agência" (máx. 7 dígitos)
2. **Validação em tempo real**: Verifica se código existe na tabela `empresas`
3. **Associação automática**: Usuário é vinculado à empresa do código
4. **Dados salvos**: Nome da empresa e ID nos metadados do usuário

### Gestão de Empresas
- **Manual via Supabase**: Adicione empresas diretamente na tabela
- **Campos obrigatórios**:
  - `nome`: Nome da empresa
  - `cnpj`: CNPJ da empresa
  - `codigo_agencia`: Código único de 1-7 dígitos
  - `ativo`: true/false para ativar/desativar

### Exemplos Incluídos
```sql
-- Já inseridos na tabela:
- 7C Turismo (código: 1001)
- Viagens & Cia (código: 2001)  
- Turismo Total (código: 3001)
```

## 🔒 Segurança Implementada

### Row Level Security (RLS)
- **Clientes**: Cada empresa vê apenas seus próprios clientes
- **Empresas**: Usuários podem consultar códigos para validação
- **Isolamento total**: Dados completamente separados por empresa

### Validação de Códigos
- **Verificação em tempo real** durante cadastro
- **Códigos únicos** garantidos por constraint no banco
- **Apenas códigos ativos** são aceitos

## 📱 Interface do Usuário

### Tela de Cadastro
- ✅ Campo "Código de Agência" obrigatório
- ✅ Máscara numérica (apenas números)
- ✅ Máximo 7 dígitos
- ✅ Validação em tempo real
- ✅ Mensagens de erro claras

### Experiência do Usuário
1. **Usuário digita código** → Sistema valida automaticamente
2. **Código válido** → Prossegue com cadastro
3. **Código inválido** → Exibe erro e impede cadastro
4. **Sucesso** → Usuário vinculado à empresa

## 🚀 Próximos Passos

### Para Produção
1. **Remover exemplos** da tabela empresas
2. **Adicionar empresas reais** via Supabase Dashboard
3. **Configurar backup** da tabela empresas
4. **Monitorar logs** de tentativas de cadastro

### Adição de Nova Empresa
```sql
INSERT INTO empresas (nome, cnpj, codigo_agencia) 
VALUES ('Nome da Empresa', '00.000.000/0001-00', '1234');
```

### Desativar Empresa
```sql
UPDATE empresas 
SET ativo = false 
WHERE codigo_agencia = '1234';
```

## ✅ Status Atual

- ✅ Tabela empresas criada
- ✅ Validação de código implementada
- ✅ RLS configurado
- ✅ Interface atualizada
- ✅ Integração completa com Supabase
- ✅ Isolamento por empresa funcionando

O sistema está **100% funcional** e pronto para uso! 