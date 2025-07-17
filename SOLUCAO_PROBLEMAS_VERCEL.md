# 🔧 Solução para Problemas da Página Pública no Vercel

## ❌ **Problema Identificado**
A página de captação de leads funciona perfeitamente no localhost, mas não funciona no Vercel (produção).

## 🔍 **Causas Comuns e Soluções**

### **1. Problema de Roteamento (SPA)**

#### **❌ Sintoma**
- Página retorna 404 no Vercel
- URL `/orcamento/empresa` não funciona
- Redirecionamentos não funcionam

#### **✅ Solução Implementada**
Criado arquivo `vercel.json` com configuração de rewrites:

```json
{
  "rewrites": [
    {
      "source": "/orcamento/:path*",
      "destination": "/index.html"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### **2. Variáveis de Ambiente**

#### **❌ Sintoma**
- Supabase não conecta
- Erro "VITE_SUPABASE_URL is not defined"
- Dados não carregam

#### **✅ Solução**
1. **No Vercel Dashboard:**
   - Vá em Settings → Environment Variables
   - Adicione:
     ```
     VITE_SUPABASE_URL=sua_url_do_supabase
     VITE_SUPABASE_ANON_KEY=sua_chave_anonima
     ```

2. **Verificar se estão sendo carregadas:**
   ```typescript
   console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
   console.log('🔑 Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
   ```

### **3. Problemas de CORS**

#### **❌ Sintoma**
- Erro "CORS policy" no console
- Requisições bloqueadas pelo navegador

#### **✅ Solução**
Adicionado headers de segurança no `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### **4. Timeout de Funções**

#### **❌ Sintoma**
- Página carrega mas formulário não envia
- Erro de timeout após 10 segundos

#### **✅ Solução**
Configurado timeout maior no `vercel.json`:

```json
{
  "functions": {
    "src/pages/SolicitacaoOrcamento.tsx": {
      "maxDuration": 30
    }
  }
}
```

## 🔧 **Melhorias Implementadas**

### **1. Logs Detalhados**
Adicionados logs para debug em produção:

```typescript
console.log('🔍 Buscando empresa:', nomeEmpresa)
console.log('✅ Empresa encontrada:', data.nome)
console.log('❌ Erro na consulta Supabase:', error)
```

### **2. Tratamento de Erros Robusto**
```typescript
if (error) {
  console.error('❌ Erro na consulta Supabase:', error)
  setError(`Erro ao buscar empresa: ${error.message}`)
  setLoading(false)
  return
}
```

### **3. Estado de Erro Melhorado**
```typescript
if (error && !empresa) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center">
        <h2>Erro ao Carregar</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Tentar Novamente
        </button>
      </div>
    </div>
  )
}
```

### **4. Validação de Dados da Empresa**
```typescript
if (!empresa) {
  throw new Error('Dados da empresa não carregados. Recarregue a página e tente novamente.')
}
```

## 🚀 **Passos para Deploy**

### **1. Configurar Variáveis de Ambiente**
```bash
# No Vercel Dashboard
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### **2. Verificar Configuração**
```bash
# Arquivos necessários:
vercel.json          # ✅ Criado
src/lib/supabase.ts  # ✅ Configurado
.env                 # ❌ NÃO commitar (usar Vercel env vars)
```

### **3. Deploy**
```bash
git add .
git commit -m "Fix: Configuração Vercel para página pública"
git push origin main
```

## 🧪 **Teste da Solução**

### **1. Teste Local**
```bash
npm run dev
# Acesse: http://localhost:5174/orcamento/7c-turismo-consultoria
```

### **2. Teste Produção**
```bash
# Após deploy no Vercel
# Acesse: https://seu-dominio.vercel.app/orcamento/7c-turismo-consultoria
```

### **3. Verificar Logs**
```bash
# No Vercel Dashboard → Functions → Logs
# Procure por:
🔍 Buscando empresa: 7c-turismo-consultoria
✅ Empresa encontrada: 7C Turismo & Consultoria
```

## 🔍 **Debug em Produção**

### **1. Console do Navegador**
```javascript
// Abra DevTools → Console
// Procure por logs:
🔍 Buscando empresa: [nome]
✅ Empresa encontrada: [nome]
❌ Erro na consulta Supabase: [erro]
```

### **2. Network Tab**
```javascript
// DevTools → Network
// Verifique se as requisições para Supabase estão funcionando
// Status deve ser 200, não 401 ou 403
```

### **3. Vercel Function Logs**
```bash
# Vercel Dashboard → Functions → [função] → Logs
# Procure por erros de timeout ou CORS
```

## 🛠️ **Comandos Úteis**

### **1. Verificar Build**
```bash
npm run build
# Verificar se não há erros de compilação
```

### **2. Teste de Produção Local**
```bash
npm run build
npm run preview
# Testa build de produção localmente
```

### **3. Verificar Variáveis**
```bash
# No código, adicione temporariamente:
console.log('ENV VARS:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20)
})
```

## 📊 **Monitoramento**

### **1. Métricas Importantes**
- **Tempo de carregamento** da página
- **Taxa de sucesso** dos formulários
- **Erros de CORS** ou timeout
- **Logs de erro** no console

### **2. Alertas**
- Página não carrega
- Formulário não envia
- Empresa não encontrada
- Erro de conexão Supabase

## 🎯 **Resultado Esperado**

Após implementar essas soluções:

- ✅ **Página carrega** corretamente no Vercel
- ✅ **Formulário envia** dados para Supabase
- ✅ **Leads são criados** no sistema CRM
- ✅ **Logs detalhados** para debug
- ✅ **Tratamento de erros** robusto
- ✅ **Interface responsiva** em todos os dispositivos

## 🔄 **Próximos Passos**

1. **Deploy** das alterações
2. **Teste** em produção
3. **Monitoramento** dos logs
4. **Ajustes** se necessário
5. **Documentação** de uso para usuários

---

**Status**: ✅ **IMPLEMENTADO**  
**Arquivos Modificados**: 
- `vercel.json` (novo)
- `src/pages/SolicitacaoOrcamento.tsx` (melhorado)
- `src/lib/supabase.ts` (já funcional) 