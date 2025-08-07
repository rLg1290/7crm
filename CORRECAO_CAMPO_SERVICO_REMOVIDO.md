# Correção: Remoção do Campo servico da Tabela contas_receber

## Problema Identificado
O sistema estava tentando inserir o campo `servico` na tabela `contas_receber`, mas este campo não existe na estrutura atual da tabela, causando erro de "coluna não encontrada no cache do esquema".

## Análise do Problema
- A tabela `contas_receber` utiliza `categoria_id` para categorizar as contas
- O código estava tentando inserir o campo `servico` que não existe na tabela
- Isso causava falhas nas inserções de contas a receber vindas das cotações

## Correções Implementadas

### 1. Arquivo: Cotacoes.tsx
- **Linha ~4770**: Removido o campo `servico` da inserção na tabela `contas_receber`
- A categorização é feita através do campo `categoria_id`

### 2. Arquivo: Financeiro.tsx
- **Interface ContasReceber**: Removido o campo `servico` da interface
- **Modal de visualização**: Removido a exibição do campo "Serviço" no modal de detalhes
- **Comentários**: Removido referências comentadas ao campo `servico`

### 3. Script SQL
- **Arquivo**: `remover_campo_servico_contas_receber.sql`
- Script para remover o campo `servico` da tabela se ainda existir

## Benefícios da Correção

1. **Eliminação de erros**: Não haverá mais falhas na inserção de contas a receber
2. **Consistência de dados**: A tabela utiliza apenas `categoria_id` para categorização
3. **Simplicidade**: Remove redundância desnecessária
4. **Manutenibilidade**: Estrutura mais limpa e consistente

## Como Testar

1. **Teste de inserção**:
   - Acesse a página de Cotações
   - Crie uma cotação com cliente
   - Clique em "Lançar venda"
   - Verifique se a conta a receber é criada sem erros

2. **Teste de exibição**:
   - Acesse a página Financeiro
   - Verifique se as contas a receber são exibidas corretamente
   - Teste o modal de visualização de detalhes

## Estrutura Final da Tabela contas_receber

```sql
CREATE TABLE contas_receber (
  id BIGSERIAL PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id),
  cliente_id BIGINT REFERENCES clientes(id),
  fornecedor_id BIGINT REFERENCES fornecedores(id),
  categoria_id BIGINT REFERENCES categorias_venda(id),
  descricao VARCHAR(255) NOT NULL,
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

- A categorização das contas é feita através do campo `categoria_id`
- O campo `descricao` pode conter informações sobre o serviço se necessário
- A estrutura agora está alinhada com o banco de dados

## Status
✅ **IMPLEMENTADO** - Todas as correções foram aplicadas e testadas