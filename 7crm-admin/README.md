# 7CRM Admin - Sistema Administrativo

Sistema administrativo para gerenciamento do 7CRM, permitindo controle completo de empresas, promoções, usuários e relatórios.

## 🚀 Funcionalidades

### 📊 Dashboard
- Visão geral das estatísticas do sistema
- Métricas de empresas e promoções
- Ações rápidas para administradores
- Atividade recente do sistema

### 🏢 Gerenciamento de Empresas
- Criar, editar e excluir empresas/agências
- Configurar logotipos e cores primárias
- Ativar/desativar empresas
- Códigos únicos de agência

### 🏷️ Gerenciamento de Promoções
- Criar e editar promoções
- Definir períodos de validade
- Associar promoções a empresas específicas
- Upload de imagens promocionais
- Controle de status (ativo/inativo)

### 👥 Gerenciamento de Usuários
- Criar novos usuários do sistema
- Definir roles (usuário/administrador)
- Associar usuários a empresas
- Controle de acesso e permissões

### 📈 Relatórios e Analytics
- Estatísticas detalhadas do sistema
- Gráficos de promoções por período
- Ranking de empresas mais ativas
- Distribuição de usuários por empresa
- Exportação de relatórios em JSON
- Filtros por período e empresa

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Icons**: Lucide React
- **Routing**: React Router DOM

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase
- Banco de dados configurado (mesmo do sistema principal)

## ⚙️ Configuração

### 1. Instalação das Dependências

```bash
npm install
```

### 2. Configuração do Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Configure as variáveis:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_APP_NAME=7CRM Admin
VITE_APP_VERSION=1.0.0
```

### 3. Configuração do Banco de Dados

O sistema utiliza o mesmo banco do 7CRM principal. Certifique-se de que as seguintes tabelas existam:

- `empresas` - Dados das agências
- `promocoes` - Promoções do sistema
- `profiles` - Perfis de usuários
- Políticas RLS configuradas para role `admin`

### 4. Executar o Sistema

```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3001`

## 🔐 Autenticação e Permissões

### Roles de Usuário

- **admin**: Acesso completo ao sistema administrativo
- **user**: Sem acesso ao sistema administrativo

### Controle de Acesso

O sistema verifica automaticamente:
1. Se o usuário está autenticado
2. Se possui role `admin`
3. Redireciona para login se não autorizado

## 📁 Estrutura do Projeto

```
7crm-admin/
├── src/
│   ├── components/
│   │   ├── Layout.tsx          # Layout principal
│   │   └── LoginPage.tsx       # Página de login
│   ├── pages/
│   │   ├── Dashboard.tsx       # Dashboard principal
│   │   ├── Empresas.tsx        # Gerenciamento de empresas
│   │   ├── Promocoes.tsx       # Gerenciamento de promoções
│   │   ├── Usuarios.tsx        # Gerenciamento de usuários
│   │   └── Relatorios.tsx      # Relatórios e analytics
│   ├── lib/
│   │   └── supabase.ts         # Configuração do Supabase
│   ├── App.tsx                 # Componente principal
│   ├── main.tsx               # Ponto de entrada
│   └── index.css              # Estilos globais
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Linting
npm run lint
```

## 🔧 Configurações Avançadas

### Customização de Cores

Edite o arquivo `tailwind.config.js` para personalizar as cores:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          // ... suas cores personalizadas
        }
      }
    }
  }
}
```

### Configuração de Políticas RLS

Certifique-se de que as políticas do Supabase permitam:

```sql
-- Exemplo de política para admins
CREATE POLICY "Admins can manage everything" ON empresas
FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

## 📊 Funcionalidades dos Relatórios

### Métricas Disponíveis
- Total de empresas (ativas/inativas)
- Total de usuários por role
- Total de promoções (ativas/inativas)
- Promoções criadas por mês
- Ranking de empresas por atividade
- Distribuição de usuários por empresa

### Filtros
- **Por período**: Filtra dados por mês/ano
- **Por empresa**: Filtra dados de empresa específica

### Exportação
- Formato JSON com todos os dados
- Inclui metadados e filtros aplicados
- Download automático do arquivo

## 🔒 Segurança

### Boas Práticas Implementadas
- Verificação de role em todas as rotas
- Validação de dados no frontend
- Políticas RLS no banco de dados
- Sanitização de inputs
- Controle de acesso baseado em roles

### Variáveis de Ambiente
- Nunca commitar arquivos `.env`
- Usar apenas chaves públicas no frontend
- Configurar CORS adequadamente

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de autenticação**
   - Verificar configuração do Supabase
   - Confirmar role do usuário

2. **Erro de permissão**
   - Verificar políticas RLS
   - Confirmar role `admin`

3. **Erro de build**
   - Limpar cache: `rm -rf node_modules package-lock.json`
   - Reinstalar: `npm install`

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Documentação do Supabase: https://supabase.com/docs
- Documentação do React: https://react.dev
- Documentação do Tailwind: https://tailwindcss.com

## 📄 Licença

Este projeto é propriedade privada. Todos os direitos reservados.