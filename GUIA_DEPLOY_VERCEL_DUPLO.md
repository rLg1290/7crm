# Guia de Deploy Duplo no Vercel

## 📋 Visão Geral
Este guia explica como fazer deploy de **2 sistemas separados** no Vercel usando o **mesmo repositório GitHub**:
- **Sistema Principal** (usuários das agências)
- **Sistema Admin** (administração)

## 🏗️ Estrutura do Projeto
```
7crm/
├── src/              # Sistema Principal
├── 7crm-admin/       # Sistema Admin
├── vercel.json       # Config do Sistema Principal
└── 7crm-admin/
    └── vercel.json   # Config do Sistema Admin
```

## 🚀 Passo a Passo

### 1. Preparar o Repositório
```bash
# Fazer commit de todas as alterações
git add .
git commit -m "Configuração para deploy duplo no Vercel"
git push origin main
```

### 2. Deploy do Sistema Principal

1. **Acesse o Vercel Dashboard**
   - Vá para [vercel.com](https://vercel.com)
   - Faça login com sua conta

2. **Criar Novo Projeto**
   - Clique em "New Project"
   - Conecte seu repositório GitHub `7crm`
   - Clique em "Import"

3. **Configurar Sistema Principal**
   - **Project Name:** `7crm-principal` (ou nome de sua escolha)
   - **Framework Preset:** Vite
   - **Root Directory:** `/` (deixe em branco - raiz do projeto)
   - **Build Command:** `npm run build` (será detectado automaticamente)
   - **Output Directory:** `dist` (será detectado automaticamente)
   - **Install Command:** `npm install` (será detectado automaticamente)

4. **Variáveis de Ambiente**
   - Adicione suas variáveis do arquivo `.env`:
   ```
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_aqui
   ```

5. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build completar
   - **URL resultante:** `https://7crm-principal.vercel.app`

### 3. Deploy do Sistema Admin

1. **Criar Segundo Projeto**
   - No Vercel Dashboard, clique em "New Project" novamente
   - Selecione o **mesmo repositório** `7crm`
   - Clique em "Import"

2. **Configurar Sistema Admin**
   - **Project Name:** `7crm-admin` (ou nome de sua escolha)
   - **Framework Preset:** Vite
   - **Root Directory:** `7crm-admin` ⚠️ **IMPORTANTE**
   - **Build Command:** `npm run build` (será detectado automaticamente)
   - **Output Directory:** `dist` (será detectado automaticamente)
   - **Install Command:** `npm install` (será detectado automaticamente)

3. **Variáveis de Ambiente**
   - Adicione as mesmas variáveis do sistema principal:
   ```
   VITE_SUPABASE_URL=sua_url_aqui
   VITE_SUPABASE_ANON_KEY=sua_chave_aqui
   ```

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build completar
   - **URL resultante:** `https://7crm-admin.vercel.app`

## ⚙️ Configurações Criadas

### Sistema Principal (`/vercel.json`)
```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/orcamento/:path*",
      "destination": "/index.html"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
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

### Sistema Admin (`/7crm-admin/vercel.json`)
```json
{
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🎯 Resultado Final

Após completar todos os passos:

- ✅ **Sistema Principal:** `https://seu-projeto.vercel.app`
  - Acesso para usuários das agências
  - Funcionalidades: cotações, clientes, calendário, etc.

- ✅ **Sistema Admin:** `https://seu-projeto-admin.vercel.app`
  - Acesso para administradores
  - Funcionalidades: gerenciar empresas, usuários, promoções

## 🔄 Deploy Automático

### Como Funciona:
- **Push na branch `main`** → ambos os sistemas fazem deploy automaticamente
- **Cada sistema** usa sua própria configuração (`vercel.json`)
- **Deployments independentes** → um sistema pode falhar sem afetar o outro

### Estrutura de Branches (Opcional):
```
main/
├── Sistema Principal (raiz)
└── Sistema Admin (7crm-admin/)
```

## 🛠️ Comandos Úteis

### Testar Localmente:
```bash
# Sistema Principal
npm run dev

# Sistema Admin
cd 7crm-admin
npm run dev
```

### Verificar Build:
```bash
# Sistema Principal
npm run build
npm run preview

# Sistema Admin
cd 7crm-admin
npm run build
npm run preview
```

## 🚨 Troubleshooting

### Problema: Build Falha
**Solução:**
1. Verifique se todas as dependências estão no `package.json`
2. Teste o build localmente primeiro
3. Verifique as variáveis de ambiente

### Problema: Roteamento SPA
**Solução:**
- Os `rewrites` no `vercel.json` já estão configurados
- Todas as rotas redirecionam para `index.html`

### Problema: Variáveis de Ambiente
**Solução:**
1. Certifique-se de que começam com `VITE_`
2. Adicione no painel do Vercel para cada projeto
3. Redeploy após adicionar variáveis

## 📝 Checklist Final

- [ ] Código commitado e enviado para GitHub
- [ ] Sistema Principal deployado no Vercel
- [ ] Sistema Admin deployado no Vercel
- [ ] Variáveis de ambiente configuradas em ambos
- [ ] URLs funcionando corretamente
- [ ] Roteamento SPA funcionando
- [ ] Deploy automático testado

## 🎉 Pronto!

Agora você tem **2 sistemas independentes** rodando no Vercel com deploy automático a partir do mesmo repositório GitHub! 🚀