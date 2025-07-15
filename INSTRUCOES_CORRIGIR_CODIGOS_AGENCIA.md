# 🔧 Correção de Códigos de Agência - Sistema 7C

## 📋 **Objetivo**
Corrigir os códigos de agência das empresas para que sejam:
- ✅ **9 dígitos** (letras e números)
- ✅ **Seguros e aleatórios**
- ✅ **Únicos** (sem duplicatas)
- ✅ **Formato**: A-Z, 0-9 (exemplo: A1B2C3D4E)

## 🚨 **Problema Identificado**
- **Erro**: `value too long for type character varying(7)`
- **Causa**: Campo `codigo_agencia` está definido como `VARCHAR(7)`
- **Solução**: Alterar para `VARCHAR(9)` e gerar códigos seguros

## 📁 **Arquivos Criados**

### 1. `correcao_completa_codigos.sql` - **RECOMENDADO** ⭐
- ✅ Corrige o campo de VARCHAR(7) para VARCHAR(9)
- ✅ Gera códigos únicos de 9 dígitos
- ✅ Corrige a empresa com código 0
- ✅ **Script completo e seguro**

### 2. `corrigir_campo_codigo_agencia.sql` - **APENAS CAMPO**
- Apenas corrige o tamanho do campo
- Execute antes dos outros scripts

### 3. `executar_correcao_codigos.sql` - **DEPOIS DO CAMPO**
- Gera códigos após corrigir o campo
- Execute após corrigir o VARCHAR

## 🎯 **Passo a Passo - EXECUÇÃO**

### **Opção 1: Correção Completa (RECOMENDADA)**

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Clique em "SQL Editor" no menu lateral
   - Clique em "New query"

3. **Execute o script completo**
   ```sql
   -- Copie e cole o conteúdo do arquivo: correcao_completa_codigos.sql
   ```

4. **Verifique os resultados**
   - Confirme que o campo agora é VARCHAR(9)
   - Confirme que a empresa tem código de 9 dígitos
   - Verifique se não há duplicatas

### **Opção 2: Correção em Etapas**

1. **Primeiro: Corrigir o campo**
   ```sql
   -- Execute: corrigir_campo_codigo_agencia.sql
   ```

2. **Depois: Gerar códigos**
   ```sql
   -- Execute: executar_correcao_codigos.sql
   ```

## 🔍 **Verificações Importantes**

### **Após a execução, confirme:**

1. **Estrutura do campo**
   ```sql
   SELECT 
       column_name,
       data_type,
       character_maximum_length
   FROM information_schema.columns 
   WHERE table_name = 'empresas' 
   AND column_name = 'codigo_agencia';
   ```
   - Deve mostrar: `VARCHAR(9)`

2. **Código da empresa**
   ```sql
   SELECT id, nome, codigo_agencia, length(codigo_agencia) 
   FROM empresas 
   WHERE codigo_agencia = '0';
   ```
   - Deve retornar 0 linhas (código 0 não deve mais existir)

3. **Novo código**
   ```sql
   SELECT id, nome, codigo_agencia, length(codigo_agencia) 
   FROM empresas 
   ORDER BY created_at;
   ```
   - Deve mostrar código de 9 dígitos (exemplo: A1B2C3D4E)

4. **Formato correto**
   ```sql
   SELECT COUNT(*) 
   FROM empresas 
   WHERE codigo_agencia ~ '^[A-Z0-9]{9}$';
   ```
   - Deve retornar o número total de empresas

## ⚠️ **Atenções Importantes**

### **Antes de executar:**
- ✅ Faça backup dos dados (se necessário)
- ✅ Execute em horário de baixo uso
- ✅ Teste primeiro em ambiente de desenvolvimento

### **Durante a execução:**
- ✅ Monitore os resultados das consultas
- ✅ Verifique se não há erros
- ✅ Confirme que o campo foi alterado para VARCHAR(9)
- ✅ Confirme que o código foi alterado

### **Após a execução:**
- ✅ Teste o login com o novo código
- ✅ Verifique se o cadastro funciona
- ✅ Confirme que não há problemas no sistema

## 🔧 **Solução de Problemas**

### **Se ainda houver erro de VARCHAR:**
```sql
-- Verificar estrutura atual
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'empresas' 
AND column_name = 'codigo_agencia';

-- Forçar alteração se necessário
ALTER TABLE empresas 
ALTER COLUMN codigo_agencia TYPE VARCHAR(9) USING codigo_agencia::VARCHAR(9);
```

### **Se houver erro de duplicata:**
```sql
-- Verificar duplicatas
SELECT codigo_agencia, COUNT(*) 
FROM empresas 
GROUP BY codigo_agencia 
HAVING COUNT(*) > 1;

-- Corrigir duplicatas
UPDATE empresas 
SET codigo_agencia = gerar_codigo_unico()
WHERE codigo_agencia IN (
    SELECT codigo_agencia 
    FROM empresas 
    GROUP BY codigo_agencia 
    HAVING COUNT(*) > 1
);
```

### **Se houver erro de formato:**
```sql
-- Verificar códigos com formato incorreto
SELECT id, nome, codigo_agencia 
FROM empresas 
WHERE codigo_agencia !~ '^[A-Z0-9]{9}$';

-- Corrigir formato
UPDATE empresas 
SET codigo_agencia = gerar_codigo_unico()
WHERE codigo_agencia !~ '^[A-Z0-9]{9}$';
```

## 📊 **Exemplos de Códigos Válidos**

### **Formato Correto:**
- ✅ `A1B2C3D4E`
- ✅ `XYZ123456`
- ✅ `ABCDEFGHI`
- ✅ `123456789`

### **Formato Incorreto:**
- ❌ `0` (muito curto)
- ❌ `ABCDEFGHIJ` (muito longo)
- ❌ `ABC-DEF-GH` (contém hífen)
- ❌ `abc123def` (minúsculas)

## 🎯 **Resultado Esperado**

### **Antes:**
```
Campo: VARCHAR(7)
Dados:
id | nome | codigo_agencia
1  | 7C   | 0
```

### **Depois:**
```
Campo: VARCHAR(9)
Dados:
id | nome | codigo_agencia
1  | 7C   | A1B2C3D4E
```

## 📞 **Suporte**

### **Se precisar de ajuda:**
1. Verifique os logs de erro no Supabase
2. Execute as consultas de verificação
3. Confirme que o campo foi alterado para VARCHAR(9)
4. Confirme que as funções foram criadas
5. Teste o sistema após a correção

---

**Status**: ✅ **SCRIPTS PRONTOS PARA EXECUÇÃO**

**Data**: Dezembro 2024

**Prioridade**: 🔴 **ALTA** - Corrigir código inseguro

**Impacto**: 🟢 **BAIXO** - Apenas correção de dados

**Problema Resolvido**: ✅ **VARCHAR(7) -> VARCHAR(9)** 