# 🔧 Geração Automática de Códigos de Agência

## 🎯 **Objetivo**
Implementar sistema que gera automaticamente códigos únicos de 9 dígitos (letras e números) quando uma nova empresa é inserida manualmente no Supabase.

## ✅ **Funcionalidades Implementadas**

### 🔄 **Geração Automática**
- ✅ **Código único**: 9 caracteres alfanuméricos (A-Z, 0-9)
- ✅ **Sem duplicatas**: Verifica se já existe antes de gerar
- ✅ **Trigger automático**: Executa antes de cada inserção
- ✅ **Valores padrão**: Define automaticamente campos opcionais

### 📋 **Campos Obrigatórios vs Opcionais**

#### **Obrigatórios:**
- ✅ **nome**: Nome da empresa (único obrigatório)

#### **Opcionais (com valores padrão):**
- 🔢 **codigo_agencia**: Gerado automaticamente se não fornecido
- 🏢 **cnpj**: String vazia se não fornecido
- ✅ **ativo**: true por padrão
- 🖼️ **logotipo**: String vazia se não fornecido
- 🔗 **slug**: String vazia se não fornecido
- 🎨 **cor_personalizada**: '#0caf99' por padrão

## 🚀 **Como Usar**

### **1. Executar o Script SQL**
1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Execute o arquivo: `gerar_codigo_automatico_empresas.sql`

### **2. Inserir Empresas Manualmente**

#### **Opção 1: Apenas com Nome (RECOMENDADO)**
```sql
INSERT INTO empresas (nome) 
VALUES ('Nome da Empresa');
```

#### **Opção 2: Com Nome e CNPJ**
```sql
INSERT INTO empresas (nome, cnpj) 
VALUES ('Nome da Empresa', '00.000.000/0001-00');
```

#### **Opção 3: Com Todos os Dados**
```sql
INSERT INTO empresas (nome, cnpj, ativo, cor_personalizada) 
VALUES ('Nome da Empresa', '00.000.000/0001-00', true, '#ff6b6b');
```

### **3. Exemplos Práticos**

#### **Empresa Simples:**
```sql
INSERT INTO empresas (nome) VALUES ('Turismo Express');
-- Resultado: código gerado automaticamente (ex: A1B2C3D4E)
```

#### **Empresa com CNPJ:**
```sql
INSERT INTO empresas (nome, cnpj) 
VALUES ('Viagens & Cia', '12.345.678/0001-90');
-- Resultado: código gerado automaticamente
```

#### **Empresa com Cor Personalizada:**
```sql
INSERT INTO empresas (nome, cor_personalizada) 
VALUES ('Turismo Premium', '#ff6b6b');
-- Resultado: código gerado + cor personalizada
```

## 🔍 **Verificações Importantes**

### **Após Executar o Script:**

1. **Verificar Estrutura da Tabela:**
```sql
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'empresas' 
ORDER BY ordinal_position;
```

2. **Verificar Empresas Existentes:**
```sql
SELECT 
    id,
    nome,
    codigo_agencia,
    cnpj,
    ativo
FROM empresas 
ORDER BY created_at;
```

3. **Testar Geração Automática:**
```sql
-- Inserir empresa de teste
INSERT INTO empresas (nome) 
VALUES ('Empresa Teste')
RETURNING id, nome, codigo_agencia, cnpj, ativo;

-- Verificar se o código foi gerado
SELECT 
    id,
    nome,
    codigo_agencia,
    length(codigo_agencia) as tamanho
FROM empresas 
WHERE nome = 'Empresa Teste';
```

## 🛡️ **Segurança e Validações**

### **Funções Criadas:**
- ✅ `gerar_codigo_agencia_automatico()`: Gera código aleatório
- ✅ `gerar_codigo_agencia_unico()`: Verifica duplicatas
- ✅ `trigger_gerar_codigo_agencia()`: Executa automaticamente

### **Validações Implementadas:**
- ✅ **Formato**: Apenas A-Z e 0-9
- ✅ **Tamanho**: Exatamente 9 caracteres
- ✅ **Unicidade**: Verifica se já existe
- ✅ **Tentativas**: Máximo 50 tentativas para evitar loop infinito

## 📊 **Exemplos de Códigos Gerados**

### **Formato Correto:**
- ✅ `A1B2C3D4E`
- ✅ `XYZ123456`
- ✅ `ABCDEFGHI`
- ✅ `123456789`

### **Características:**
- 🔢 **9 caracteres** sempre
- 🔤 **Letras maiúsculas** (A-Z)
- 🔢 **Números** (0-9)
- 🎲 **Aleatórios** e únicos
- 🔒 **Sem duplicatas** garantidas

## 🔧 **Troubleshooting**

### **Se o Trigger Não Funcionar:**
```sql
-- Verificar se o trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'empresas';
```

### **Se Houver Erro de Duplicata:**
```sql
-- Verificar duplicatas
SELECT codigo_agencia, COUNT(*) 
FROM empresas 
GROUP BY codigo_agencia 
HAVING COUNT(*) > 1;
```

### **Se Precisar Regenerar Códigos:**
```sql
-- Regenerar código para empresa específica
UPDATE empresas 
SET codigo_agencia = gerar_codigo_agencia_unico()
WHERE id = 'uuid-da-empresa';
```

## 🎯 **Resultado Esperado**

### **Antes:**
```sql
-- Erro ao inserir apenas com nome
INSERT INTO empresas (nome) VALUES ('Nova Empresa');
-- ERRO: codigo_agencia não pode ser NULL
```

### **Depois:**
```sql
-- Sucesso ao inserir apenas com nome
INSERT INTO empresas (nome) VALUES ('Nova Empresa');
-- RESULTADO: 
-- id: uuid
-- nome: 'Nova Empresa'
-- codigo_agencia: 'A1B2C3D4E' (gerado automaticamente)
-- cnpj: '' (vazio)
-- ativo: true
```

## 📞 **Suporte**

### **Para Problemas:**
1. Verifique se o script foi executado completamente
2. Confirme que as funções foram criadas
3. Teste com uma inserção simples
4. Verifique os logs de erro no Supabase

---

**Status**: ✅ **PRONTO PARA USO**

**Data**: Dezembro 2024

**Prioridade**: 🟢 **MÉDIA** - Melhoria de usabilidade

**Impacto**: 🟢 **BAIXO** - Apenas facilita inserção manual 