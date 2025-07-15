# Instruções para Implementar Contas a Receber

## Problema
As contas a receber não estão sendo exibidas na planilha do banco de dados.

## Solução Implementada

### 1. Correções Realizadas

#### 1.1 Interfaces TypeScript Corrigidas
- **Arquivo**: `src/services/financeiroService.ts`
- **Mudanças**:
  - Interface `ContasReceber` atualizada para corresponder à estrutura da tabela
  - Interface `NovaContaReceber` atualizada
  - Tipos de status corrigidos para `'recebida' | 'pendente' | 'vencida'`

#### 1.2 Página Financeiro Corrigida
- **Arquivo**: `src/pages/Financeiro.tsx`
- **Mudanças**:
  - Interface `ContasReceber` local atualizada
  - Função `carregarContasReceber` melhorada com logs de debug
  - Correção na busca do `empresa_id` do usuário
  - Remoção de dados mockados que sobrescreviam dados reais
  - Correção na exibição do campo `cliente_nome` na tabela

#### 1.3 Serviço Financeiro Melhorado
- **Arquivo**: `src/services/financeiroService.ts`
- **Mudanças**:
  - Logs de debug adicionados nas funções `getContasReceber` e `criarContaReceber`
  - Melhor tratamento de erros

### 2. Estrutura da Tabela contas_receber

A tabela `contas_receber` tem a seguinte estrutura:
```sql
CREATE TABLE contas_receber (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  cliente_nome VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  servico VARCHAR(100) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  data_recebimento DATE,
  forma_recebimento VARCHAR(50),
  observacoes TEXT,
  comprovante_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Passos para Testar

#### 3.1 Execute os Scripts SQL
1. Abra o Supabase Dashboard
2. Vá para o SQL Editor
3. Execute na ordem:
   - `criar_tabelas_financeiro.sql` (se ainda não executou)
   - `inserir_dados_exemplo_contas_receber.sql`

#### 3.2 Verifique no Console do Navegador
Após acessar a página Financeiro, verifique no console:
1. **Ao carregar**: "Carregando contas a receber para empresa: [ID]"
2. **Busca**: "Buscando contas a receber para empresa: [ID]"
3. **Resultado**: "Contas a receber encontradas: [dados]"

#### 3.3 Teste a Funcionalidade
1. Acesse a página Financeiro
2. Clique na aba "Contas a Receber"
3. Verifique se as contas aparecem na tabela
4. Teste os filtros e ações

### 4. Funcionalidades Disponíveis

#### 4.1 Visualização
- Lista todas as contas a receber da empresa
- Exibe: Cliente, Descrição, Serviço, Valor, Vencimento, Status
- Ordenação por data de vencimento

#### 4.2 Resumo
- Total a receber
- Contas vencidas
- Contas recebidas

#### 4.3 Status das Contas
- **Pendente**: Conta ainda não recebida
- **Recebida**: Conta já foi paga
- **Vencida**: Conta passou do prazo

### 5. Próximos Passos (Funcionalidades Futuras)

#### 5.1 Modal de Nova Conta a Receber
- Formulário para adicionar nova cobrança
- Seleção de cliente
- Definição de valor e vencimento
- Categorização por serviço

#### 5.2 Ações nas Contas
- Marcar como recebida
- Editar conta
- Excluir conta
- Gerar relatórios

#### 5.3 Filtros Avançados
- Por período de vencimento
- Por status
- Por cliente
- Por serviço

### 6. Troubleshooting

#### Problema: Contas não aparecem
**Solução**:
1. Verifique se a tabela `contas_receber` existe
2. Verifique se há dados na tabela
3. Verifique se o usuário tem `empresa_id` válido
4. Verifique os logs no console do navegador

#### Problema: Erro de RLS
**Solução**:
1. Execute o script `criar_tabelas_financeiro.sql` completo
2. Verifique se as políticas RLS estão criadas

#### Problema: Interface não carrega
**Solução**:
1. Verifique se não há erros de TypeScript
2. Verifique se todas as interfaces estão corretas
3. Verifique se o serviço está sendo importado corretamente

### 7. Arquivos Modificados

1. `src/services/financeiroService.ts` - Interfaces e funções do serviço
2. `src/pages/Financeiro.tsx` - Página principal do financeiro
3. `inserir_dados_exemplo_contas_receber.sql` - Dados de teste
4. `INSTRUCOES_CONTAS_RECEBER_IMPLEMENTACAO.md` - Este arquivo

### 8. Status da Implementação

✅ **Concluído**:
- Estrutura da tabela
- Interfaces TypeScript
- Função de busca de contas
- Exibição na tabela
- Logs de debug

🔄 **Em Desenvolvimento**:
- Modal de nova conta
- Ações nas contas
- Filtros avançados

📋 **Planejado**:
- Relatórios
- Exportação de dados
- Integração com outros módulos 