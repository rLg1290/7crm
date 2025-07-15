# Sistema CRM

Sistema de CRM moderno construído com React, TypeScript, Tailwind CSS e Supabase.

## 🚀 Funcionalidades

- ✅ Autenticação completa (Login/Cadastro)
- ✅ Interface moderna e responsiva
- ✅ Integração com Supabase
- ✅ TypeScript para tipagem
- ✅ Tailwind CSS para estilização

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
src/
├── components/
│   ├── LoginPage.tsx    # Página de login/cadastro
│   └── Dashboard.tsx    # Dashboard principal
├── lib/
│   └── supabase.ts      # Configuração Supabase
├── App.tsx              # Componente principal
├── main.tsx             # Entry point
└── index.css            # Estilos globais
```

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