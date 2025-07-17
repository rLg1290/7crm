# Instruções para Resolver Problema do Status não Salvar

## Problema Identificado
O status "paga" não está sendo salvo no banco de dados quando uma nova conta é criada.

## Passos para Resolver

### 1. Executar Script de Verificação
1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o script `verificar_estrutura_contas_pagar.sql`
4. Verifique os resultados para identificar problemas na estrutura da tabela

### 2. Executar Script de Correção
1. No **SQL Editor** do Supabase
2. Execute o script `corrigir_tabela_contas_pagar.sql`
3. Este script irá:
   - Verificar se a tabela existe
   - Criar a tabela se não existir
   - Adicionar constraints para valores válidos de status
   - Corrigir contas com status nulo ou inválido
   - Criar índices para performance
   - Configurar RLS (Row Level Security)

### 3. Testar o Sistema
1. **Abra o navegador** e acesse o sistema
2. **Abra o Console do navegador** (F12 → Console)
3. **Tente criar uma nova conta a pagar:**
   - Clique em "Nova Conta a Pagar"
   - Preencha os campos obrigatórios
   - **Clique no botão "Paga"** (deve ficar verde)
   - Clique em "Salvar Conta"
   - **Verifique os logs no console**

### 4. Logs Esperados
Se tudo estiver funcionando, você deve ver no console:
```
Status atual: PAGA
Status sendo enviado: PAGA
Status recebido: PAGA
Status após fallback: PAGA
Dados que serão inseridos no banco: {..., status: "PAGA", ...}
Conta a pagar criada com sucesso: {...}
Status salvo no banco: PAGA
```

### 5. Possíveis Problemas e Soluções

#### Problema: Status aparece como "PENDENTE" no banco
**Solução:** Verificar se o campo status está sendo enviado corretamente no frontend

#### Problema: Erro de constraint
**Solução:** O script de correção já adiciona a constraint correta

#### Problema: Erro de RLS (Row Level Security)
**Solução:** O script de correção já configura as políticas RLS

### 6. Verificação Final
Após executar os scripts, verifique se:
- ✅ A tabela `contas_pagar` existe
- ✅ O campo `status` aceita os valores: 'PENDENTE', 'PAGA', 'VENCIDA'
- ✅ Não há contas com status nulo
- ✅ As políticas RLS estão configuradas

### 7. Se o Problema Persistir
1. Verifique os logs do console para identificar onde está falhando
2. Execute novamente o script de verificação
3. Verifique se há erros no Supabase Dashboard → Logs

## Scripts Criados
- `verificar_estrutura_contas_pagar.sql` - Para diagnosticar problemas
- `corrigir_tabela_contas_pagar.sql` - Para corrigir problemas
- Logs adicionados no `financeiroService.ts` para debug

## Contato
Se o problema persistir após seguir estas instruções, forneça os logs do console para análise adicional. 