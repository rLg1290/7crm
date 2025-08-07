# ✅ Checklist Pré-Deploy

## 📋 Verificações Obrigatórias

### 🔧 Configurações Técnicas
- [ ] **vercel.json** criado na raiz (Sistema Principal)
- [ ] **vercel.json** criado em `/7crm-admin/` (Sistema Admin)
- [ ] Ambos os sistemas fazem build local sem erros
- [ ] Variáveis de ambiente configuradas (`.env`)
- [ ] Dependências atualizadas (`package.json`)

### 🗄️ Banco de Dados
- [ ] Tabelas criadas no Supabase:
  - [ ] `usuarios`
  - [ ] `empresas`
  - [ ] `clientes`
  - [ ] `promocoes` (com `empresa_id` opcional)
  - [ ] `cotacoes`
- [ ] Políticas RLS configuradas
- [ ] Dados de teste inseridos (opcional)

### 🔐 Segurança
- [ ] Chaves do Supabase não expostas no código
- [ ] Variáveis de ambiente começam com `VITE_`
- [ ] Políticas de segurança configuradas
- [ ] Headers de segurança no `vercel.json`

### 🎨 Interface
- [ ] **Sistema Principal** funcionando:
  - [ ] Login/Cadastro
  - [ ] Dashboard
  - [ ] Gestão de clientes
  - [ ] Sistema de cotações
  - [ ] Calendário
- [ ] **Sistema Admin** funcionando:
  - [ ] Login administrativo
  - [ ] Gestão de empresas
  - [ ] Gestão de usuários
  - [ ] Gestão de promoções
  - [ ] Exclusão de promoções

## 🧪 Testes Locais

### Sistema Principal
```bash
# Teste de build
npm run build
npm run preview

# Teste de desenvolvimento
npm run dev
```

### Sistema Admin
```bash
# Teste de build
cd 7crm-admin
npm run build
npm run preview

# Teste de desenvolvimento
npm run dev
```

## 📝 Documentação
- [ ] README.md atualizado
- [ ] Guia de deploy criado
- [ ] Instruções de configuração claras
- [ ] Estrutura do projeto documentada

## 🚀 Preparação para Deploy

### Git
```bash
# Verificar status
git status

# Adicionar arquivos
git add .

# Commit final
git commit -m "Preparação para deploy duplo no Vercel"

# Push para GitHub
git push origin main
```

### Informações Necessárias
- [ ] URL do repositório GitHub
- [ ] Credenciais do Vercel
- [ ] Variáveis de ambiente do Supabase:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## 🎯 Pós-Deploy

### Verificações
- [ ] Sistema Principal acessível
- [ ] Sistema Admin acessível
- [ ] Login funcionando em ambos
- [ ] Funcionalidades principais testadas
- [ ] Deploy automático funcionando

### URLs Esperadas
- **Sistema Principal:** `https://seu-projeto.vercel.app`
- **Sistema Admin:** `https://seu-projeto-admin.vercel.app`

## 🚨 Troubleshooting Comum

### Build Falha
1. Verificar dependências no `package.json`
2. Testar build local primeiro
3. Verificar imports/exports
4. Verificar variáveis de ambiente

### Roteamento SPA
1. Verificar `rewrites` no `vercel.json`
2. Testar navegação entre páginas
3. Verificar refresh da página

### Banco de Dados
1. Verificar conexão com Supabase
2. Verificar políticas RLS
3. Verificar estrutura das tabelas
4. Verificar variáveis de ambiente

## ✨ Pronto para Deploy!

Quando todos os itens estiverem marcados, você está pronto para seguir o **[Guia de Deploy Vercel Duplo](./GUIA_DEPLOY_VERCEL_DUPLO.md)**! 🚀