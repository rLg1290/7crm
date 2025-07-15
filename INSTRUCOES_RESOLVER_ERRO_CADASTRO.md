# 🚨 RESOLVER ERRO DE CADASTRO - Instruções

## 🎯 Problema
**Erro ao cadastrar** - A funcionalidade de cadastro não está funcionando porque a tabela `empresas` não foi criada no Supabase.

## 🔍 Causa Raiz
Durante o cadastro, o sistema tenta validar o código de agência consultando a tabela `empresas`:
```sql
SELECT id, nome FROM empresas 
WHERE codigo_agencia = '1001' AND ativo = true
```

Se esta tabela não existir, o erro ocorre e o cadastro falha.

## ✅ Solução Completa

### 1. **Criar Tabela Empresas no Supabase**

1. **Acesse o Supabase Dashboard:**
   - Vá para [supabase.com](https://supabase.com)
   - Entre no seu projeto
   - Navegue para `SQL Editor`

2. **Execute o Script SQL:**
   - Copie todo o conteúdo do arquivo `supabase_empresas_table.sql`
   - Cole no SQL Editor
   - Clique em "Run" para executar

### 2. **Teste o Cadastro**

Após criar a tabela, teste com um dos códigos de exemplo:
- **Código 1001** - Empresa: 7C Turismo
- **Código 2001** - Empresa: Viagens & Cia  
- **Código 3001** - Empresa: Turismo Total

### 3. **Verificação Passo a Passo**

1. **Abra o sistema** em http://localhost:5181 (ou a porta atual)
2. **Clique em "Não tem uma conta? Cadastre-se"**
3. **Preencha os campos:**
   - Nome: Seu nome completo
   - Código de Agência: `1001` (ou 2001, 3001)
   - Email: seu@email.com
   - Senha: uma senha segura
4. **Clique em "Cadastrar"**
5. **Deve aparecer:** "Cadastro realizado com sucesso! Verifique seu email para confirmar a conta."

## 🔧 Troubleshooting

### Se ainda houver erro:

1. **Verifique se as tabelas foram criadas:**
   - No Supabase Dashboard → Table Editor
   - Deve aparecer a tabela `empresas` com 3 registros

2. **Teste a conexão:**
   - Abra o Console do navegador (F12)
   - Deve aparecer: "🔗 Supabase conectado: https://ethmgn..."

3. **Verifique RLS (Row Level Security):**
   - A política deve permitir leitura dos códigos de agência
   - Política: "Qualquer um pode verificar códigos de agência"

### Mensagens de Erro Comuns:

- **"Código de Agência inválido"** → O código não existe na tabela ou está inativo
- **"Erro no cadastro: ..."** → Problema na comunicação com Supabase
- **"Erro inesperado"** → Problema de conexão ou configuração

## 📱 Códigos de Teste Disponíveis

Após executar o script, estes códigos estarão disponíveis:

| Código | Empresa | Status |
|--------|---------|---------|
| 1001 | 7C Turismo | Ativo |
| 2001 | Viagens & Cia | Ativo |
| 3001 | Turismo Total | Ativo |

## 🎉 Após Resolver

Uma vez funcionando:
1. ✅ Cadastro de usuários funcionará normalmente
2. ✅ Validação de código de agência ativa
3. ✅ Usuários ficarão vinculados à empresa correta
4. ✅ Sistema de autenticação completo

## ⚡ Execução Rápida

**Para resolver imediatamente:**
1. Copie o conteúdo de `supabase_empresas_table.sql`
2. Cole no SQL Editor do Supabase
3. Execute (Run)
4. Teste cadastro com código `1001`

**Pronto! O erro será resolvido.** 🎯 