# Correção: Remoção do Campo cliente_nome da Tabela contas_receber

## Problema Identificado
O sistema estava tentando inserir o campo `cliente_nome` na tabela `contas_receber`, mas este campo não existe na estrutura atual da tabela, causando erro de "coluna não encontrada no cache do esquema".

## Análise do Problema
- A tabela `contas_receber` utiliza apenas `cliente_id` para referenciar clientes
- O código estava tentando inserir tanto `cliente_id` quanto `cliente_nome`
- Isso causava falhas silenciosas nas inserções de contas a receber

## Correções Implementadas

### 1. Arquivo: Cotacoes.tsx
- **Linha ~4760**: Removido o campo `cliente_nome` da inserção na tabela `contas_receber`
- Mantido apenas `cliente_id` para a referência ao cliente

### 2. Arquivo: Financeiro.tsx
- **Interface ContasReceber**: Removido o campo `cliente_nome` da interface
- **Estados iniciais**: Removido `cliente_nome` dos estados de reset
- **Handlers de seleção**: Removido a atribuição de `cliente_nome` nos handlers de cliente e fornecedor
- **Exibição de dados**: Corrigido para buscar o nome do cliente dinamicamente baseado no `cliente_id`
- **Modal de exclusão**: Implementado lookup dinâmico do nome do cliente/fornecedor
- **Dashboard**: Corrigido a exibição de entidades nas contas próximas do vencimento

### 3. Script SQL
- **Arquivo**: `remover_campo_cliente_nome_contas_receber.sql`
- Script para remover o campo `cliente_nome` da tabela se ainda existir

## Benefícios da Correção

1. **Eliminação de erros**: Não haverá mais falhas na inserção de contas a receber
2. **Consistência de dados**: A tabela utiliza apenas `cliente_id` como referência
3. **Performance**: Evita redundância de dados (nome já está na tabela clientes)
4. **Manutenibilidade**: Dados centralizados na tabela de origem

## Como Testar

1. **Teste de inserção**:
   - Acesse a página de Cotações
   - Crie uma cotação com cliente
   - Clique em "Lançar venda"
   - Verifique se a conta a receber é criada sem erros

2. **Teste de exibição**:
   - Acesse a página Financeiro
   - Verifique se as contas a receber exibem o nome do cliente corretamente
   - Teste o modal de exclusão para ver se o nome aparece

3. **Teste do dashboard**:
   - Verifique se as contas próximas do vencimento mostram o nome da entidade

## Estrutura Final da Tabela contas_receber

```sql
CREATE TABLE contas_receber (
  id BIGSERIAL PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id),
  cliente_id BIGINT REFERENCES clientes(id),
  fornecedor_id BIGINT REFERENCES fornecedores(id),
  categoria_id BIGINT REFERENCES categorias_venda(id),
  descricao VARCHAR(255) NOT NULL,
  servico VARCHAR(255),
  valor DECIMAL(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  recebido_em TIMESTAMP,
  forma_recebimento_id BIGINT REFERENCES formas_recebimento(id),
  observacoes TEXT,
  comprovante_url VARCHAR(500),
  origem VARCHAR(50),
  origem_id BIGINT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Observações Importantes

- O nome do cliente/fornecedor é obtido dinamicamente através de lookup nas respectivas tabelas
- Isso garante que sempre tenhamos o nome atualizado, mesmo se o cliente alterar seu nome
- A performance não é impactada significativamente pois os dados de clientes já são carregados na página

## Status
✅ **IMPLEMENTADO** - Todas as correções foram aplicadas e testadas