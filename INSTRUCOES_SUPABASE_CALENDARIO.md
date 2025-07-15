# 📅 Configuração do Calendário no Supabase

## 🎯 Objetivo
Conectar a aba de calendário ao Supabase para torná-la totalmente funcional com operações CRUD (Create, Read, Update, Delete) de tarefas e compromissos.

## 🚀 Passos para Configuração

### 1. Criar as Tabelas no Supabase

1. **Acesse o Dashboard do Supabase**
   - Vá para [supabase.com](https://supabase.com)
   - Entre no seu projeto
   - Navegue para `SQL Editor`

2. **Execute o Script SQL**
   - Copie todo o conteúdo do arquivo `supabase_calendario_tables.sql`
   - Cole no SQL Editor
   - Clique em "Run" para executar

### 2. Verificar as Tabelas Criadas

As seguintes tabelas foram criadas:

#### 📋 Tabela `tarefas`
- **Colunas principais:**
  - `id` (UUID) - Chave primária
  - `empresa_id` (UUID) - Referência à empresa
  - `usuario_id` (UUID) - Referência ao usuário
  - `titulo` (VARCHAR) - Título da tarefa
  - `descricao` (TEXT) - Descrição detalhada
  - `prioridade` (ENUM) - alta, media, baixa
  - `status` (ENUM) - pendente, em-andamento, concluida, cancelada
  - `data_vencimento` (DATE) - Data de vencimento
  - `hora_vencimento` (TIME) - Hora de vencimento
  - `responsavel` (VARCHAR) - Nome do responsável
  - `categoria` (ENUM) - vendas, atendimento, administrativo, reuniao, viagem
  - `cliente` (VARCHAR) - Nome do cliente (opcional)
  - `notificacoes` (BOOLEAN) - Se deve enviar notificações

#### 📅 Tabela `compromissos`
- **Colunas principais:**
  - `id` (UUID) - Chave primária
  - `empresa_id` (UUID) - Referência à empresa
  - `usuario_id` (UUID) - Referência ao usuário
  - `titulo` (VARCHAR) - Título do compromisso
  - `tipo` (ENUM) - reuniao, ligacao, atendimento, viagem, evento
  - `data` (DATE) - Data do compromisso
  - `hora_inicio` (TIME) - Hora de início
  - `hora_fim` (TIME) - Hora de fim
  - `local` (VARCHAR) - Local do compromisso (opcional)
  - `participantes` (TEXT[]) - Array de participantes
  - `descricao` (TEXT) - Descrição detalhada
  - `status` (ENUM) - agendado, confirmado, cancelado, realizado
  - `cliente` (VARCHAR) - Nome do cliente (opcional)

### 3. Funcionalidades Implementadas

#### ✅ **CRUD Completo**
- **Criar** tarefas e compromissos
- **Listar** com filtros (status, prioridade, data)
- **Atualizar** status das tarefas e compromissos
- **Excluir** registros (função disponível no serviço)

#### 📊 **Estatísticas em Tempo Real**
- Tarefas pendentes, em andamento, concluídas
- Tarefas urgentes (alta prioridade)
- Compromissos do dia

#### 🗓️ **Calendário Visual**
- Exibição de eventos por dia
- Navegação entre meses
- Seleção de dias para criar eventos
- Informações detalhadas do dia selecionado

#### 🔒 **Segurança (RLS)**
- Políticas de segurança configuradas
- Usuários só veem dados da própria empresa
- Isolamento total entre empresas

### 4. Como Usar

#### **Criar Nova Tarefa**
1. Clique em "Nova Tarefa" (calendário ou aba tarefas)
2. Preencha os campos obrigatórios (título, data, hora, responsável)
3. Escolha prioridade e categoria
4. Salve - a tarefa aparecerá no calendário e lista

#### **Criar Novo Compromisso**
1. Clique em "Novo Compromisso"
2. Preencha título, tipo, data, horários
3. Adicione participantes (separados por vírgula)
4. Salve - o compromisso aparecerá no calendário

#### **Atualizar Status**
- Clique no ícone ✅ para marcar tarefa como concluída
- Clique no ícone ✅ para confirmar compromisso

### 5. Estrutura de Arquivos

```
src/
├── services/
│   └── calendarioService.ts      # Serviço para API do Supabase
├── pages/
│   └── Calendario.tsx            # Componente principal
└── lib/
    └── supabase.ts               # Configuração do Supabase
```

### 6. Melhorias Futuras

#### 🔔 **Notificações**
- Integração com sistema de notificações existente
- Lembretes automáticos
- Webhooks para eventos importantes

#### 📱 **Funcionalidades Avançadas**
- Edição inline de tarefas/compromissos
- Arrastar e soltar no calendário
- Repetição de eventos
- Sincronização com calendários externos

#### 📈 **Relatórios**
- Relatório de produtividade
- Análise de tempo gasto por categoria
- Gráficos de conclusão de tarefas

### 7. Testes

Para testar as funcionalidades:

1. **Teste Básico:**
   - Crie uma tarefa com data de hoje
   - Verifique se aparece no calendário
   - Marque como concluída
   - Verifique se as estatísticas foram atualizadas

2. **Teste de Filtros:**
   - Crie tarefas com diferentes status e prioridades
   - Use os filtros na aba tarefas
   - Verifique se a filtragem funciona corretamente

3. **Teste de Navegação:**
   - Navegue entre meses no calendário
   - Clique em diferentes dias
   - Verifique se os eventos são exibidos corretamente

### 8. Resolução de Problemas

#### **Erro de Autenticação**
- Verifique se o usuário está logado
- Confirme se `empresa_id` está no `user_metadata`

#### **Dados Não Aparecem**
- Verifique as políticas RLS no Supabase
- Confirme se as tabelas foram criadas corretamente
- Verifique o console do navegador para erros

#### **Erro ao Salvar**
- Verifique campos obrigatórios
- Confirme formato de datas e horas
- Verifique permissões no Supabase

---

## 🎉 Pronto!

O calendário agora está totalmente funcional e conectado ao Supabase. Os usuários podem criar, visualizar e gerenciar tarefas e compromissos com segurança e performance. 