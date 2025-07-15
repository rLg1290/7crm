# 📋 Instruções para Executar o Script SQL no Supabase

## 🎯 Objetivo
Corrigir o erro 400 na criação de tarefas de check-in executando o script SQL de correção.

## 🚀 Passo a Passo

### 1. **Acessar o Supabase Dashboard**
1. Abra seu navegador
2. Acesse: https://supabase.com/dashboard
3. Faça login na sua conta
4. Selecione seu projeto

### 2. **Abrir o SQL Editor**
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique no botão **"New query"** (Nova consulta)

### 3. **Copiar e Colar o Script**
1. Abra o arquivo `corrigir_tarefas_simples.sql` no seu projeto
2. Copie todo o conteúdo do arquivo
3. Cole no SQL Editor do Supabase

### 4. **Executar o Script**
1. Clique no botão **"Run"** (Executar) ou pressione **Ctrl+Enter**
2. Aguarde a execução completa
3. Verifique se não há erros na saída

### 5. **Verificar os Resultados**
O script irá mostrar:
- ✅ Estrutura da tabela tarefas
- ✅ Políticas RLS criadas
- ✅ Confirmação de que as correções foram aplicadas

## 🔍 Verificação do Sucesso

### **Mensagens Esperadas:**
```
✅ Políticas RLS removidas e recriadas
✅ Colunas adicionadas/removidas conforme necessário
✅ Estrutura da tabela verificada
```

### **Estrutura Final Esperada da Tabela:**
```sql
id: UUID (PRIMARY KEY)
empresa_id: UUID (REFERENCES empresas)
usuario_id: UUID (REFERENCES auth.users)
titulo: VARCHAR(255) NOT NULL
descricao: TEXT
prioridade: VARCHAR(10) DEFAULT 'media'
status: VARCHAR(20) DEFAULT 'pendente'
data_vencimento: DATE NOT NULL
hora_vencimento: TIME
responsavel: VARCHAR(255) NOT NULL
categoria: VARCHAR(20) DEFAULT 'vendas'
cliente: VARCHAR(255)
notificacoes: BOOLEAN DEFAULT true
created_at: TIMESTAMP WITH TIME ZONE
updated_at: TIMESTAMP WITH TIME ZONE
```

## 🧪 Teste da Funcionalidade

### **Após executar o script:**

1. **Volte ao seu sistema** e teste:
   - Crie uma cotação com voos
   - Configure localizadores nos voos
   - Lance a venda
   - Verifique se as tarefas de check-in são criadas

2. **Verifique no Console do Navegador (F12):**
   ```
   ✅ Tarefa de check-in criada com sucesso para voo: ABC123
   ```

3. **Verifique no Calendário:**
   - As tarefas de check-in devem aparecer na data correta
   - Com o título "CHECK-IN [LOCALIZADOR]"

## ❌ Se Houver Problemas

### **Erro de Permissão:**
- Verifique se você tem permissão de administrador no projeto
- Tente executar o script em partes menores

### **Erro de Sintaxe:**
- Verifique se copiou o script completo
- Certifique-se de que não há caracteres especiais

### **Erro de Política RLS:**
- O script já corrige isso automaticamente
- Se persistir, execute novamente

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs de erro no Supabase
2. Confirme que o script foi executado completamente
3. Teste a funcionalidade novamente
4. Se necessário, execute o script em partes menores

## ✅ Checklist Final

- [ ] Script executado com sucesso
- [ ] Sem erros na saída do SQL
- [ ] Tarefas de check-in sendo criadas
- [ ] Sem mais erros 400 no console
- [ ] Tarefas aparecem no calendário 