# 🎨 Logotipo_2 para Promoções Implementado

## ✅ Alterações Realizadas

### 🗄️ **Banco de Dados**

#### **Nova Coluna na Tabela Empresas**
- ✅ Adicionada coluna `logotipo_2 TEXT` 
- 📝 Armazena URL da segunda imagem do logotipo (específica para promoções)
- 🔧 Campo opcional (pode ser NULL)
- 🎯 **Finalidade**: Logo específica para materiais promocionais

#### **Scripts SQL Criados**
1. **`adicionar_campo_logotipo_2.sql`** - Para adicionar coluna em tabela existente

### 🎯 **Onde o Logotipo_2 Aparece**

#### **Página de Promoções**
- 🖼️ **Preview das promoções**: Badge superior com logo da empresa
- 📥 **Download de imagens**: Logo no badge da imagem gerada
- 📱 **Template visual**: Header do template de promoção

### 💻 **Implementação Técnica**

#### **Interface TypeScript Atualizada**
```typescript
interface EmpresaConfig {
  cor_secundaria?: string
  cor_personalizada?: string
  cor_primaria?: string
  logotipo?: string        // Logo principal (header, perfil)
  logotipo_2?: string      // Logo para promoções ← NOVO
  nome: string
}
```

#### **Busca no Banco Atualizada**
```typescript
const { data: empresa, error } = await supabase
  .from('empresas')
  .select('nome, logotipo, logotipo_2, cor_personalizada, cor_secundaria, cor_primaria')
  .eq('id', empresaId)
  .single()
```

### 🔄 **Diferenças entre Logotipos**

#### **logotipo (Original)**
- 🏠 **Uso**: Header do sistema, página de perfil
- 📍 **Localização**: Layout principal da aplicação
- 🎨 **Contexto**: Identidade visual geral

#### **logotipo_2 (Novo)**
- 🎯 **Uso**: Promoções, materiais de marketing
- 📍 **Localização**: Badges das promoções, imagens geradas
- 🎨 **Contexto**: Campanhas promocionais específicas

### 🎨 **Onde é Usado o Logotipo_2**

#### **1. Preview das Promoções**
```typescript
// Tentar carregar logo da agência (usando logotipo_2 para promoções)
const logoUrl = empresaConfig.logotipo_2
```

#### **2. Função de Download**
```typescript
if (empresaConfig.logotipo_2) {
  try {
    const logoImg = await loadImage(empresaConfig.logotipo_2)
    // Desenhar logo da agência centralizada no badge
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
  }
}
```

#### **3. Template Visual**
```jsx
{empresaConfig.logotipo_2 ? (
  <img 
    src={empresaConfig.logotipo_2} 
    alt="Logo" 
    className="h-12 w-12 object-contain bg-white rounded-lg p-1"
  />
) : (
  <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center">
    <Building className="h-6 w-6 text-gray-600" />
  </div>
)}
```

### 🔄 **Tratamento de Fallbacks**

#### **Se logotipo_2 não estiver definido**
1. **Preview/Download**: Mostra nome da empresa no badge
2. **Template**: Mostra ícone Building como fallback
3. **Carregamento**: Trata erros de URL inválida

### 🚀 **Como Configurar**

#### **1. Executar Script SQL**
```sql
-- Execute no Supabase SQL Editor
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logotipo_2 TEXT;
```

#### **2. Adicionar URL da Logo**
```sql
UPDATE empresas 
SET logotipo_2 = 'https://sua-url-da-logo-promocional.com/logo.png'
WHERE codigo_agencia = '1001';
```

#### **3. Formatos Recomendados**
- 📏 **Tamanho**: 120x120px ou superior (quadrado)
- 📁 **Formato**: PNG, JPG, SVG
- 🗜️ **Otimização**: Comprimida para web
- 🎨 **Fundo**: Transparente (PNG) recomendado
- 🎯 **Design**: Adequada para badges circulares/quadrados

### ⚡ **Benefícios da Separação**

- 🎯 **Especialização**: Logo específica para promoções
- 🎨 **Flexibilidade**: Diferentes logos para diferentes contextos
- 📱 **Otimização**: Logo otimizada para materiais promocionais
- 🔄 **Independência**: Não afeta a logo principal do sistema
- 💼 **Branding**: Campanhas com identidade visual específica

### ✅ **Status da Implementação**

- ✅ Campo logotipo_2 adicionado à interface
- ✅ Script SQL criado
- ✅ Busca no banco atualizada
- ✅ Preview usando logotipo_2
- ✅ Download usando logotipo_2
- ✅ Template visual usando logotipo_2
- ✅ Fallbacks implementados
- ✅ Configurações padrão atualizadas
- ✅ Documentação completa

### 🔧 **Para Testar**

1. **Execute o script SQL** no Supabase
2. **Configure uma URL** para logotipo_2 na sua empresa
3. **Acesse a página de promoções**
4. **Gere o preview** de uma promoção
5. **Faça o download** da imagem
6. **Verifique** se a logo aparece nos badges

### 📊 **Exemplo de Configuração**

```sql
-- Exemplo: Configurar logo promocional para empresa
UPDATE empresas 
SET logotipo_2 = 'https://exemplo.com/logo-promocional.png'
WHERE codigo_agencia = '1001';

-- Verificar configuração
SELECT nome, logotipo, logotipo_2 
FROM empresas 
WHERE codigo_agencia = '1001';
```

O sistema está **100% funcional** com logotipo_2 implementado para promoções! 🎉