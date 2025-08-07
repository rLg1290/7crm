# Sistema CRM

Sistema de CRM moderno construído com React, TypeScript, Tailwind CSS e Supabase.

## 🏗️ Estrutura do Projeto

Este repositório contém **2 sistemas independentes**:

- **Sistema Principal** (`/`) - Interface para usuários das agências
- **Sistema Admin** (`/7crm-admin/`) - Painel administrativo

## 🚀 Funcionalidades

### Sistema Principal
- ✅ Autenticação completa (Login/Cadastro)
- ✅ Gestão de clientes
- ✅ Sistema de cotações
- ✅ Calendário de eventos
- ✅ Interface moderna e responsiva

### Sistema Admin
- ✅ Gestão de empresas
- ✅ Gestão de usuários
- ✅ Gestão de promoções
- ✅ Painel administrativo completo

### Tecnologias
- ✅ React + TypeScript
- ✅ Tailwind CSS
- ✅ Supabase (Backend)
- ✅ Vite (Build tool)

## 📋 Pré-requisitos

- Node.js 18+ 
- Conta no Supabase

## ⚙️ Configuração

### 1. Clone e instale dependências
```bash
cd crm-system
npm install
```

### 2. Configure o Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Vá em Settings > API
4. Copie a URL e a anon key

### 3. Configure variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 4. Execute o projeto
```bash
npm run dev
```

O sistema estará disponível em `http://localhost:5173`

## 🎯 Como usar

1. **Primeiro acesso**: Clique em "Cadastro" e crie sua conta
2. **Login**: Use seu email e senha para entrar
3. **Dashboard**: Após login, você verá a tela principal do CRM

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (Auth + Database)

## 📁 Estrutura do projeto

```
7crm/
├── src/                 # Sistema Principal
│   ├── components/
│   ├── lib/
│   └── ...
├── 7crm-admin/          # Sistema Admin
│   ├── src/
│   ├── components/
│   └── ...
├── vercel.json          # Config deploy Sistema Principal
└── GUIA_DEPLOY_VERCEL_DUPLO.md
```

## 🚀 Executar Localmente

### Sistema Principal
```bash
# Na raiz do projeto
npm install
npm run dev
# Acesse: http://localhost:5173
```

### Sistema Admin
```bash
# No diretório admin
cd 7crm-admin
npm install
npm run dev
# Acesse: http://localhost:5174
```

## 🌐 Deploy no Vercel

Para fazer deploy dos **2 sistemas separados** no Vercel:

📖 **[Consulte o Guia Completo](./GUIA_DEPLOY_VERCEL_DUPLO.md)**

O guia inclui:
- ✅ Configuração de deploy duplo
- ✅ Passo a passo detalhado
- ✅ Configuração de variáveis de ambiente
- ✅ Troubleshooting
- ✅ Deploy automático

## 🎨 Design

- Interface moderna com gradientes
- Formulários intuitivos com validação
- Design responsivo (mobile-first)
- Tema claro com tons de azul
- Componentes reutilizáveis

## 🚀 Próximos passos

- [ ] Página de clientes
- [ ] Página de vendas
- [ ] Dashboard com gráficos
- [ ] Relatórios
- [ ] Configurações do usuário

---

Desenvolvido com ❤️ usando React + Supabase